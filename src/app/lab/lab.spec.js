describe( 'lab section' , function () {
    var scope, httpBackend;
    var CONFIG = 'CONFIG';
    var selectedTab = 'lab';
    
    // mock Application to allow us to inject our own dependencies
    beforeEach( module('treelud.lab' ));

    // mock the controller for the same reason and include $rootScope and $controller
    beforeEach( angular.mock.inject( function ($rootScope, $controller, _$httpBackend_ ) {
        // create an empty scope
        scope = $rootScope.$new();
        scope.selectedTab = selectedTab;

        // declare the controller and inject our empty scope
        $controller( 'LabCtrl' , { $scope: scope, CONFIG: CONFIG } );
    }));

    it( 'should have a dummy test', inject( function() {
        expect( true ).toBeTruthy();
    }));

});
