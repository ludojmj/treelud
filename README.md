# [treelud](https://github.com/ludojmj/treelud)

Yet another tree view in a web browser.

 - HTTP Server code: [Python](https://www.python.org/)
 - Client code: [AngularJS](https://angularjs.org/)
 - Data sources: local and SSH file systems

***

## Building the web site (AngularJS)

Install [Node.js](https://nodejs.org/) and then:

    ```sh
    $ git clone https://github.com/ludojmj/treelud.git
    $ cd treelud
    $ sudo npm -g install grunt-cli karma bower
    $ npm install
    $ bower install
    $ grunt
    ```
Your web site is ready!

You may fix paths to start with. Go to:

 - `treelud/src/assets/config.json` before building with grunt
 - `treelud/build/assets/config.json` after a grunt build
 - `treelud/bin/assets/config.json` after a grunt compile

    ```
    {
        "LOCALPATH": "/home/mauricemoss",
        "REMOTEPATH": "/www"
    }
    ```

## Configuring the HTTP server

Fix host and port server infos and SSH server infos in:

 - `treelud/server/server.py`

N.B. If you want to connect to your host from a different device (your mobile phone or your tablet), you must set your server net address (e.g. '192.168.0.12') instead of 'localhost' or '127.0.0.1'.

    ```
    THIS_HOST = '192.168.0.12'
    THIS_PORT = 8002

    SSH_SERVER = '192.168.0.24'
    SSH_PORT = 22
    SSH_USER = 'moss.m'
    SSH_PASSW = 'lonelyroad'
    ```

Launch the http server:

    ```sh
    python server/server.py
    ```

## Go!

Eventually, in your web browser (preferably Firefox), open:

 - `http://192.168.0.12:8002/build/` if you did a grunt build
 - `http://192.168.0.12:8002/bin/` if you did a grunt compile
 - `http://127.0.0.1:8002/` if you did not previously fix host and port server infos

***

## Purpose

 - Using AngulaJS.
 - Doing a simple tree view taking a file system as the data source.
 - Doing basic stuff with locally hosted files (copy, open, delete) and remote files (copy, delete).
 - Making a basic remote control.
 - Being able to run locally hosted applications when opening a file (e.g. opening "mymovie.avi" on a mobile phone or a tablet should run VLC on the server).

## How it works

Basically, there's a master tree that includes a sub-tree:

    ```
    <div>
        <div ng-repeat="item in localTree" ng-include="'subTree.tpl.html'"></div>
    </div>
    ```

And the sub-tree recursively includes itself:

    ```
    <div>
        <ul>
            <li ng-repeat="item in item.children" ng-include="'subTree.tpl.html'"></li>
        </ul>
    </div>
    ```

We do it twice: once for the local directory, again for the remote (SSH) directory.

## Project Structure

 - AngularJS: I tried to follow Josh David Miller's opinionated kickstarter for AngularJS projects: [ngbp](https://github.com/ngbp/ngbp).
 - HTTP Server: There's only one Python script (server.py). In order to get SSH access, this script uses [paramiko] (https://pypi.python.org/pypi/paramiko) and [python-ecdsa](https://pypi.python.org/pypi/ecdsa).

***

## Requirements

### AngularJS

 - ngbp <https://github.com/ngbp/ngbp> Copyright (c) 2013 Josh David Miller <josh@joshdmiller.com>
 - AngularJS <http://angularjs.org> Copyright (c) 2010-2014 Google, Inc.
 - angular-ui <https://angular-ui.github.io/> Copyright (c) 2012-2014 the AngularUI Team
 - knacss <http://www.knacss.com/> Raphael Goetter, Alsacreations

### HTTP server (server.py)

 - Python <https://www.python.org/> created in the early 1990s by Guido van Rossum
 - pycrypto <https://pypi.python.org/pypi/pycrypto>
 - paramiko <https://pypi.python.org/pypi/paramiko> Copyright (c) 2003-2011 Robey Pointer <robeypointer@gmail.com>
 - python-ecdsa <https://pypi.python.org/pypi/ecdsa> Copyright (c) 2010 Brian Warner

### SSH server

 - openssh-server <http://www.openssh.com/>
