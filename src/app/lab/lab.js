angular.module( 'treelud.lab', [
    'ui.router',
    'treelud.common',
    'ngResource'
])

.config( function config( $stateProvider ) {
    $stateProvider.state( 'lab', {
        url: '/lab',
        resolve: {
            CONFIG: ['ConfigFactory', function (ConfigFactory) {
                return ConfigFactory.get().$promise;
            }]
        },
        views: {
            'main': {
                controller: 'LabCtrl',
                templateUrl: 'tree2/rootTree.tpl.html' // Reusing template
            }
        },
        data: { pageTitle: 'Lab', lab: true }
    });
})

// Trying stuff here... For instance: loading the whole file system in one-shot.
.controller( 'LabCtrl', function labController( $scope, CONFIG, MessageFactory, InitLabFactory, NotImplementedSrv, ToggleLabFolderSrv ) {

    // Set initial local and remote paths
    $scope.config = CONFIG;
    
    // Init Messages
    $scope.msgList = MessageFactory.msgList;

    // Init local and remote file systems
    InitLabFactory.work( $scope );

    // Open/Close folder
    $scope.toggleFolder = function( item, islocal ) {
        ToggleLabFolderSrv.work( $scope, item, islocal );
    };

    // Open local file
    $scope.openFile = NotImplementedSrv.work;

    // Select file to copy
    $scope.toggleSelect = NotImplementedSrv.work;

    // Delete local/remote file
    $scope.deleteFile = NotImplementedSrv.work;

    // Put/get file to/from remote folder
    $scope.sendFile = NotImplementedSrv.work;

})

.factory( 'InitLabFactory', function ( WebApiFactory, MessageFactory, MsgTypeEnum ) {
    // Read local and remote file systems
    return {
        'work': function( scope ) {
            scope.localTree = [];
            scope.remoteTree = [];

            // Get servers infos
            WebApiFactory.save({
                'action': 'info'
            }, function ( successResult ) { // OK
                scope.localTitle = successResult.localServer;
                scope.remoteTitle = successResult.remoteServer;
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data.error, MsgTypeEnum.ERROR );
            });

            // Init left panel (local)
            WebApiFactory.save({
                'action': 'browsedir', 'localfs': true, 'pagination': false, 'path': scope.config.LOCALPATH
            }, function ( successResult ) { // OK
                scope.localTree.push( successResult );
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data.error, MsgTypeEnum.ERROR );
            });

            // Remote path initialization (right panel)
            var timestamp = (new Date()).getTime(); // We want to remove the info as soon as we've got a response from the resource
            MessageFactory.setWaitingMsg( 'Please wait while loading ' + scope.pageTitle + ' file system...', timestamp );

            // Init right panel (remote)
            WebApiFactory.save({
                'action': 'browsedir', 'localfs': false, 'pagination': false, 'path': scope.config.REMOTEPATH
            }, function ( successResult ) { // OK
                scope.remoteTree.push( successResult );
                MessageFactory.setWaitingMsg( '', timestamp );
            }, function ( errorResult ) { // KO
                MessageFactory.setMsg( errorResult.data===null ? errorResult : errorResult.data.error, MsgTypeEnum.ERROR );
                MessageFactory.setWaitingMsg( '', timestamp );
            });
        }
    };
})

.factory( 'ToggleLabFolderSrv', function () {
    // Open/Close folder
    var localSavedItem = {};
    var remoteSavedItem = {};
    return {
        'work': function( scope, item, islocal ) {
            if ( islocal ) {
                if ( angular.isDefined(scope.localSelectedItem) ) {
                    // Unselect item if click elsewhere
                    scope.localSelectedItem.selected = false;
                }

                // Local (left panel)
                if ( item.isopen ) {
                    // Save opened folder
                    localSavedItem[item.id] = item.children;
                    item.children = [];
                } else {
                    // Restore folder
                    item.children = localSavedItem[item.id];
                }
                item.isopen = !item.isopen;
                return;
            }

            if ( angular.isDefined(scope.remoteSelectedItem) ) {
                // Unselect item if click elsewhere
                scope.remoteSelectedItem.selected = false;
            }

            // Remote (right panel)
            if ( item.isopen ) {
                // Save opened folder
                remoteSavedItem[item.id] = item.children;
                item.children = [];
            } else {
                // Restore folder
                item.children = remoteSavedItem[item.id];
            }
            item.isopen = !item.isopen;
        }
    };
})

.factory( 'NotImplementedSrv', function ( MessageFactory, MsgTypeEnum ) {
    return {
        'work': function() {
            MessageFactory.setMsg( 'Not implemented.', MsgTypeEnum.ERROR );
        }
    };
})

;
