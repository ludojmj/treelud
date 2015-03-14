angular.module( 'treelud', [
    'templates-app',
    'templates-common',
    'treelud.common',
    'treelud.tree1',
    'treelud.tree2',
    'treelud.lab',
    'ui.router',
    'ngResource'
])

.config( function myAppConfig ( $stateProvider, $urlRouterProvider ) {
    $urlRouterProvider.otherwise( '/tree1' );
})

.run( function run () {
})

.controller( 'AppCtrl', function appController ( $scope, $location ) {
    $scope.$on('$stateChangeSuccess', function( event, toState, toParams, fromState, fromParams ){
        if ( angular.isDefined( toState.data.pageTitle ) ) {
            $scope.pageTitle = toState.data.pageTitle ;
        }
        
        // Highlight active tab in index.html
        $scope.selectedTab = { 'local': false, 'localremote': false, 'lab': false };
        for ( var name in $scope.selectedTab ) {
            if ( angular.isDefined( toState.data[name] ) ) {
                $scope.selectedTab[name] = toState.data[name];
            }
        }
    });

})

;
