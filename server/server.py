#! /usr/bin/env python2
# -*- coding: utf-8 -*-

"""
- Author: Ludovic, Jean, Michel Jarno (La Ville Jarno en Ploërmel, Guillac, Lanouée) <ludovic.villejarno@gmail.com>
- Licence: MIT

Requirements
------------
 - Python <https://www.python.org/> created in the early 1990s by Guido van Rossum
 - pycrypto <https://pypi.python.org/pypi/pycrypto>
 - paramiko <https://pypi.python.org/pypi/paramiko> Copyright (c) 2003-2011 Robey Pointer <robeypointer@gmail.com>
 - python-ecdsa <https://pypi.python.org/pypi/ecdsa> Copyright (c) 2010 Brian Warner

"""

import SimpleHTTPServer, SocketServer, BaseHTTPServer
import json
import os
import paramiko
import socket
import stat
import subprocess
import sys
import uuid
import urlparse

class SystemAccess():
    
    """ SystemAccess """

    def __init__(self, localfs):
        #
        # Usage: """with SystemAccess(localfs) as sftp:""" ==> Local: normal filesystem / Remote: SSH filesystem
        #
        self.remotefs = not localfs
        if self.remotefs:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(SSH_SERVER, SSH_PORT, SSH_USER, SSH_PASSW)
            self.sftp = self.client.open_sftp()


    def __enter__(self):
        #
        # What kind of filesystem is invoked? Local: normal filesystem / Remote: SSH filesystem
        #
        if self.remotefs:
            # Remote SSH
            return self.sftp
        # Local O.S.
        return os

    
    def __exit__(self, type, value, traceback):
        #
        # """end with"""
        #
        if self.remotefs:
            self.sftp.close()
            self.client.close()


class FsInteract():

    """ FsInteract """

    def delete(self, path, localfs):
        #
        # Delete file
        #
        with SystemAccess(localfs) as sftp:
            sftp.remove(path)


    def put(self, localpath, remotepath):
        #
        # Copy local file to remote folder
        #
        source = localpath
        destination = remotepath
        destination = u'{0}/{1}'.format(destination, os.path.basename(source))
        with SystemAccess(False) as sftp:
            sftp.put(source, destination)


    def get(self, remotepath, localpath):
        #
        # Copy remote file to local folder
        #
        source = remotepath
        destination = localpath
        destination = u'{0}/{1}'.format(destination, os.path.basename(source))
        with SystemAccess(False) as sftp:
            sftp.get(source, destination)


class BuildDict():
    
    """ BuildDict """

    def isdir(self, conn, path):
        #
        # Check if the objet is a directory (depends whether the request is local->normal FS or remote->SSH FS)
        #
        if type(conn) <> paramiko.SFTPClient:
            return os.path.isdir(path)
        try:
            return stat.S_ISDIR(conn.stat(path).st_mode)
        except IOError:
            return False


    def error(self, errmsg):
        #
        # Get error message from exception (string format depends whether the request runs on *nix or win)
        #
        cod = 'utf-8'
        if os.name == 'nt':
            cod = 'cp1252'

        return { 'id': str(uuid.uuid1()), 'path': str(errmsg).decode(cod), 'islocked': True }


    def path_to_dict(self, root, localfs):
        #
        # Convert local path or remote path into dictionary
        #
        with SystemAccess(localfs) as conn:
            
            # Init root folder
            result = { 'path': root, 'isfolder': True, 'isopen': True, 'children': [] }

            # Browsing folders first...
            try:
                dir_list = sorted(conn.listdir(root))
                for x in dir_list:
                    full_path = u'{0}/{1}'.format(root, x)
                    if self.isdir(conn, full_path):
                        result['children'].append( { 'path': full_path, 'isfolder': True, 'isopen': False } )
            except OSError, e :
                # Forbidden folder on local fs
                result['children'].append(self.error(e))
                return result
            except IOError, e:
                # Forbidden folder on remote fs
                result['children'].append(self.error(e))
                return result
            except UnicodeDecodeError, e:
                # Unreadable file
                result['children'].append(self.error(e))
                return result

            # ...Then files
            fic_list = sorted(conn.listdir(root))
            for x in fic_list:
                full_path = u'{0}/{1}'.format(root, x)
                if not self.isdir(conn, full_path):
                    result['children'].append( { 'path': full_path, 'isfolder': False, 'isopen': False } )

            return result


    def fullfs_to_dict(self, root, localfs, init):
        #
        # Recursive method
        # Convert whole FS (local or remote) into dictionary
        #
        with SystemAccess(localfs) as conn:
            result = { 'id': str(uuid.uuid1()), 'path': root, 'isfolder': True, 'isopen': True, 'children': [] }
            
            if self.isdir(conn, root):
                try:
                    dir_list = conn.listdir(root)
                except OSError, e :
                    # Forbidden folder on local fs
                    result['children'].append(self.error(e))
                    return result
                except IOError, e:
                    # Forbidden folder on remote fs
                    result['children'].append(self.error(e))
                    return result
                except UnicodeDecodeError, e:
                    # Unreadable file
                    result['children'].append(self.error(e))
                    return result

                if len(dir_list) > FULL_FS_MAX_DEPTH and init:
                    result['children'].append( { 'id': str(uuid.uuid1()), 'path': u'{0} folders/files here'.format(len(dir_list)), 'islocked': True } )
                    return result

                # Recursive
                result['children'] = [ self.fullfs_to_dict(u'{0}/{1}'.format(root, x), localfs, True) for x in dir_list]
            else:
                if not init:
                    result['children'].append( { 'id': str(uuid.uuid1()), 'path': u'No such file', 'islocked': True } )
                result['isfolder'] = False
                result['isopen'] = False

            return result


class ThreadingSimpleServer(SocketServer.ThreadingMixIn, BaseHTTPServer.HTTPServer):
    
    """ ThreadingSimpleServer """

    pass


# class ReuseTCPServer(SocketServer.TCPServer):
#  
#     """ ReuseTCPServer """
#
#     allow_reuse_address = True


class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    
    """ MyHandler """

    def error(self, errmsg):
        #
        # Get error message from exception (string format depends whether the request runs on *nix or win)
        #
        cod = 'utf-8'
        if os.name == 'nt':
            cod = 'cp1252'

        return str(errmsg).decode(cod)


    def build_response(self, http_code, msg):
        #
        # Add http headers
        #
        self.send_response(http_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        if (http_code == 400):
            resp = {}
            resp['error'] = self.error(str(msg))
        else:
            resp = msg
        self.wfile.write(json.dumps(resp))
        self.wfile.close();


    def do_json(self, localfs, pagination, path):
        #
        # Convert dictionary into JSON
        #
        try:
            if pagination:
                result = BuildDict().path_to_dict(path, localfs)
            else:
                result = BuildDict().fullfs_to_dict(path, localfs, False)
            self.build_response(200, result)
        except paramiko.SSHException, e:
            self.build_response(400, e)
        except paramiko.AuthenticationException, e:
            self.build_response(400, e)
        except socket.error, e:
            self.build_response(400, e)


    def do_GET(self):
        #
        # Get other unhandled pages
        #
        SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)


    def do_POST(self):
        #
        # Standard directory browsing
        #
        if not self.path.startswith('/api'):
            self.do_GET()
            return

        # Route ---------------------------------------------
        postvars = self.rfile.read(int(self.headers['Content-Length']))
        params = json.loads(postvars)
        action = params['action']
        # Route ---------------------------------------------

        #
        # Get servers IP
        #
        if action == 'info':
            info = { 'localServer': '{0}:{1}'.format(THIS_HOST, THIS_PORT), 'remoteServer': '{0}:{1}'.format(SSH_SERVER, SSH_PORT) }
            self.build_response(200, info)
            return

        #
        # Open a file (on the server)
        #
        if action == 'openfile':
            path = params['path']
            try:
                if os.name == 'posix':
                    subprocess.check_output(['xdg-open', path], stderr=subprocess.STDOUT, shell=False)
                elif os.name == 'nt':
                    os.startfile(path)
                else: # elif sys.platform.startswith('darwin'):
                    # Not tested
                    subprocess.check_output(['open', path], stderr=subprocess.STDOUT, shell=False)
                self.build_response(200, { 'info': 'File opened successfully.' })
            except subprocess.CalledProcessError, e:
                self.build_response(400, e.output.split(':')[-1])
            except WindowsError, e:
                self.build_response(400, e)
            return

        #
        # Delete a file
        #
        if action == 'del':
            try:
                path = params['path']
                localfs = params['localfs']
                FsInteract().delete(path, localfs)
                self.build_response(200, { 'info': 'File deleted successfully.' })
            except Exception, e:
                self.build_response(400, e)
            return


        #
        # SSH put and get
        #
        if action == 'put' or action == 'get':
            try:
                # Copy objects
                source = params['source']
                destination = params['destination']
                if action == 'put':
                    FsInteract().put(source, destination)
                else:
                    FsInteract().get(source, destination)
                self.build_response(201, { 'info': 'File copied successfully.' }) # Created
            except Exception, e:
                self.build_response(400, e)
            return

        #
        # Build a JSON tree
        #
        if action == 'browsedir':
            localfs = params['localfs']
            pagination = params['pagination']
            try:
                path = params['path'].replace('\\','/')
            except:
                path = '/'
            if os.name == 'nt' and localfs and path == '/':
                path = 'C:/'
            self.do_json(localfs, pagination, path)
            return

        #
        # Bad if we get there
        #
        self.build_response(400, ValueError('Invalid client side action...'))


if __name__ == '__main__':

    # Fix host and port server infos
    THIS_HOST = '127.0.0.1'
    THIS_PORT = 8002
    
    # Fix ssh server infos
    SSH_SERVER = '127.0.0.1'
    SSH_PORT = 22
    SSH_USER = 'moss.m'
    SSH_PASSW = 'lonelyroad'

    # If we browse the whole FS (pagination==false), responses must be shrunk to prevent client from being overwhelmed.
    FULL_FS_MAX_DEPTH = 3 

    # Change the directory to get to client one (bin or build folder)
    # os.chdir('..')

    # Run http server
    print 'Serving HTTP on {0} port {1} for {2}...'.format(THIS_HOST, THIS_PORT, os.getcwd())
    httpd = ThreadingSimpleServer((THIS_HOST, THIS_PORT), MyHandler) 
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print 'KeyboardInterrupt'

