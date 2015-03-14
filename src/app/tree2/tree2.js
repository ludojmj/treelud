angular.module( 'treelud.tree2', [
    'ui.router',
    'treelud.common',
    'ngResource'
])

.config( function config( $stateProvider) {
    $stateProvider.state( 'tree2', {
        url: '/tree2',
        resolve: {
            CONFIG: ['ConfigFactory', function (ConfigFactory) {
                return ConfigFactory.get().$promise;
            }]
        },
        views: {
            'main': {
                controller: 'Tree2Ctrl',
                templateUrl: 'tree2/rootTree.tpl.html'
            }
        },
        data: { pageTitle: 'Local & Remote', localremote: true }
    });
})

.controller( 'Tree2Ctrl', function tree2Controller( $scope, CONFIG, MessageFactory, ServerInfoFactory, LocalTreeFactory, RemoteTreeFactory, OpenFileSrv, ToggleSelectSrv, DeleteFileSrv, SendFileSrv, ToggleFolderSrv ) {

    // Set initial local and remote paths
    $scope.config = CONFIG;
    
    // Init Messages
    $scope.msgList = MessageFactory.msgList;

    // Get server info
    ServerInfoFactory.work( $scope );

    // Init local file system
    LocalTreeFactory.work( $scope );

    // Init remote file system
    // Won't be done in case of "tree1" state (local directory)
    RemoteTreeFactory.work( $scope );

    // Select file to open/copy/delete
    $scope.toggleSelect = function( item, islocal ) {
        ToggleSelectSrv.work( $scope, item, islocal );
    };

    // Open/Close folder
    $scope.toggleFolder = function( item, islocal ) {
        ToggleFolderSrv.work( $scope, item, islocal );
    };

    // Open local file
    $scope.openFile = function( item ) {
        OpenFileSrv.work( item );
    };

    // Delete local/remote file
    $scope.deleteFile = function( item, islocal ) {
        item.toDelete = true;
    };
    $scope.confirm = function( item, islocal ) {
        DeleteFileSrv.work( $scope, item, islocal );
    };
    $scope.cancel = function( item, islocal ) {
        item.toDelete = false;
    };

    // Copy file to/from remote folder
    $scope.sendFile = function( item, islocal ) {
        SendFileSrv.work( $scope, item, islocal );
    };

})

.factory( 'ServerInfoFactory', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Get infos about servers (local and remote)
    return {
        'work': function( scope ) {
            WebApiFactory.save({
                'action': 'info'
            }, function ( successResult ) { // OK
                scope.localTitle = successResult.localServer;
                scope.remoteTitle = successResult.remoteServer;
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data===null ? errorResult : errorResult.data.error, MsgTypeEnum.ERROR );
            });
        }
    };
})

.factory( 'LocalTreeFactory', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Feed local tree (left panel)
    return {
        'work': function( scope ) {
            scope.localTree = [];

            WebApiFactory.save({
                'action': 'browsedir', 'localfs': true, 'pagination': true, 'path': scope.config.LOCALPATH
            },function ( successResult ) { // OK
                scope.localTree.push( successResult );
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data===null ? errorResult : errorResult.data.error, MsgTypeEnum.ERROR );
            });
        }
    };
})

.factory( 'RemoteTreeFactory', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Feed remote tree (right panel)
    return {
        'work': function( scope ) {
            if ( scope.selectedTab.local ) {
                // No need to be done if we're in local tree state (only one local tree in this case)
                return;
            }
            
            scope.remoteTree = [];

            // Remote path initialization (right panel)
            var timestamp = (new Date()).getTime(); // We want to remove the info as soon as we've got a response from the resource
            MessageFactory.setWaitingMsg( 'Please wait while loading remote file system...', timestamp );

            WebApiFactory.save({ // Init remote tree
                'action': 'browsedir', 'localfs': false, 'pagination': true, 'path': scope.config.REMOTEPATH
            },function ( successResult ) { // OK
                scope.remoteTree.push( successResult );
                MessageFactory.setWaitingMsg( '', timestamp );
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data===null ? errorResult : errorResult.data.error, MsgTypeEnum.ERROR );
                MessageFactory.setWaitingMsg( '', timestamp );
            });
        }
    };
})

.factory( 'ToggleSelectSrv', function () {
    // Select file to open/copy/delete
    return {
        'work': function( scope, item, islocal ) {
            if ( islocal ) {
                // Select file in left panel (local)
                if ( angular.isDefined(scope.localSelectedItem) ) {
                    scope.localSelectedItem.selected = false;
                    scope.localSelectedItem.toDelete = false;
                    delete scope.localSelectedItem;
                }
                item.selected = !item.selected;
                scope.localSelectedItem = item;
                
                return;
            }
         
            // Select file in right panel (remote)
            if ( angular.isDefined(scope.remoteSelectedItem) ) {
                scope.remoteSelectedItem.selected = false;
                scope.remoteSelectedItem.toDelete = false;
                delete scope.remoteSelectedItem;
            }
            item.selected = !item.selected;
            scope.remoteSelectedItem = item;
        }
    };
})

.factory( 'ToggleFolderSrv', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Open/Close folder
    return {
        'work': function( scope, item, islocal ) {
            if ( item.isopen ) {
                // Close folder (whatever local or remote)
                item.children = [];
                item.isopen = false;
                return;
            }

            if ( islocal && angular.isDefined(scope.localSelectedItem) ) {
                scope.localSelectedItem.selected = false;
                scope.localSelectedItem.toDelete = false;
                delete scope.localSelectedItem;
            }
            if ( !islocal && angular.isDefined(scope.remoteSelectedItem) ) {
                scope.remoteSelectedItem.selected = false;
                scope.remoteSelectedItem.toDelete = false;
                delete scope.remoteSelectedItem;
            }

            item.notification = 'Loading...';
            WebApiFactory.save({ // Open local folder
                'action': 'browsedir', 'localfs': islocal, 'pagination': true, 'path': item.path
            }, function ( successResult ) { // OK
                item.children = successResult.children;
                item.isopen = !item.isopen;
                item.notification = '';
            }, function ( errorResult ) { // KO
                item.notification = '';
                MessageFactory.setMsg( item.path + ' : Error.', MsgTypeEnum.ERROR );
            });
            return;

        }
    };
})

.factory( 'OpenFileSrv', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Open local file on host (subprocess.call(('xdg-open', path))
    return {
        'work': function( item ) {
            WebApiFactory.save({
                'action': 'openfile', 'path': item.path
            }, function ( successResult ) { // OK
                MessageFactory.setMsg( 'File opened. You might press ALT+TAB to switch to the corresponding application.', MsgTypeEnum.SUCCESS );
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data.error, MsgTypeEnum.ERROR );
            });
        }
    };
})

.factory( 'DeleteFileSrv', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Delete local/remote file
    return {
        'work': function( scope, item, islocal ) {
            WebApiFactory.save({
                'action': 'del', 'path': item.path, 'localfs': islocal
            }, function ( successResult ) { // OK
                item.deleted = true;
                MessageFactory.setMsg( successResult.info, MsgTypeEnum.SUCCESS );
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data.error, MsgTypeEnum.ERROR );
            });
        }
    };
})

.factory( 'SendFileSrv', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Copy file to/from remote folder
    return {
        'work': function( scope, item, islocal ) {

            if (islocal) {
                if ( !angular.isDefined(scope.remoteSelectedItem) ) {
                    MessageFactory.setMsg( 'No remote destination folder selected.', MsgTypeEnum.ERROR );
                    return;
                }
                if ( !scope.remoteSelectedItem.isfolder ) {
                    MessageFactory.setMsg( 'Remote destination should be a folder.', MsgTypeEnum.ERROR );
                    return;
                }

                var timestamp = (new Date()).getTime(); // We want to remove the info as soon as we've got a response from the resource
                MessageFactory.setWaitingMsg( 'Please wait while sending file...', timestamp );

                // Put file to remote folder
                item.notification = 'Sending...';
                WebApiFactory.save({
                    'action': 'put', 'source': item.path, 'destination': scope.remoteSelectedItem.path
                }, function ( successResult ) { // OK
                    if ( angular.isDefined(scope.remoteSelectedItem) ) {
                        // Refresh folder with the received file
                        scope.remoteSelectedItem.isopen = false; 
                        scope.toggleFolder( scope.remoteSelectedItem, false );
                    }
                    item.notification = '';
                    MessageFactory.setMsg( successResult.info, MsgTypeEnum.SUCCESS );
                    MessageFactory.setWaitingMsg( '', timestamp );
                }, function ( errorResult ) { // KO
                    item.notification = '';
                    MessageFactory.setMsg( errorResult.data.error, MsgTypeEnum.ERROR );
                    MessageFactory.setWaitingMsg( '', timestamp );
                });
                return;
            }

            // Get file from remote folder
            if ( !angular.isDefined(scope.localSelectedItem) ) {
                MessageFactory.setMsg( 'No local destination folder selected.', MsgTypeEnum.ERROR );
                return;
            }
            if ( !scope.localSelectedItem.isfolder ) {
                MessageFactory.setMsg( 'Local destination should be a folder.', MsgTypeEnum.ERROR );
                return;
            }

            var timestamp2 = (new Date()).getTime(); // We want to remove the info as soon as we've got a response from the resource
            MessageFactory.setWaitingMsg( 'Please wait while sending file...', timestamp2 );

            item.notification = 'Sending...';
            WebApiFactory.save({
                'action': 'get', 'source': item.path, 'destination': scope.localSelectedItem.path
            }, function ( successResult ) { // OK
                if ( angular.isDefined(scope.localSelectedItem) ) {
                    // Refresh folder with the received file
                    scope.localSelectedItem.isopen = false;
                    scope.toggleFolder( scope.localSelectedItem, true );
                }
                item.notification = '';
                MessageFactory.setMsg( successResult.info, MsgTypeEnum.SUCCESS );
                MessageFactory.setWaitingMsg( '', timestamp2 );
            }, function ( errorResult ) { // KO
                item.notification = '';
                MessageFactory.setMsg( errorResult.data.error, MsgTypeEnum.ERROR );
                MessageFactory.setWaitingMsg( '', timestamp2 );
            });
        }
    };
})

;
