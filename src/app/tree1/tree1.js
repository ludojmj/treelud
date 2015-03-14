//
// This module reuses tree2 controller & template
//
                
angular.module( 'treelud.tree1', [
    'ui.router'
])

.config( function config( $stateProvider ) {
    $stateProvider.state( 'tree1', {
        url: '/tree1',
        resolve: {
            CONFIG: ['ConfigFactory', function (ConfigFactory) {
                return ConfigFactory.get().$promise;
            }]
        },
        views: {
            'main': {
                controller: 'Tree2Ctrl',               // Reusing tree2 controller
                templateUrl: 'tree2/rootTree.tpl.html' // Reusing tree2 template
            }
        },
        data: { pageTitle: 'Local', local: true }
    });
})

;
