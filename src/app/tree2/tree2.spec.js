describe( 'tree2 section' , function () {
    var scope, httpBackend;
    var CONFIG = 'CONFIG';
    var selectedTab = 'local';
    
    // mock Application to allow us to inject our own dependencies
    beforeEach( module('treelud.tree2' ));

    // mock the controller for the same reason and include $rootScope and $controller
    beforeEach( angular.mock.inject( function ($rootScope, $controller, _$httpBackend_ ) {
        // create an empty scope
        scope = $rootScope.$new();
        scope.selectedTab = selectedTab;

        // declare the controller and inject our empty scope
        $controller( 'Tree2Ctrl' , { $scope: scope, CONFIG: CONFIG } );
    }));

    it( 'should have a dummy test', inject( function() {
        expect( true ).toBeTruthy();
    }));

});
