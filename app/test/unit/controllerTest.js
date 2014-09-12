'use strict';
var allVersions = {"2.2.0":true, "2.2.1":true, "2.5.0":true, "2.5.1":true, "3.0.0":true, "3.0.1":true}

var dataGen = function(version){

   versionData = [];
   for (var i = 0; i < 100; i++) { 
     versionData.push({"Version": version+"-"+i,
                       "AbsPassed": 66,
                       "AbsFailed": 42,
                       "RelPassed": 61.111111111111114,
                       "RelFailed":38.888888888888886});
   }

   return versionData;
}

/* jasmine specs for controllers go here */
describe('Tests for GreenBoard controllers', function() {


  beforeEach(module('greenboardControllers'));

  /* ---- TIMELINE CTRL ----- */
  describe('TimelineCtrl', function(){
    var scope, ctrl, $httpBackend;

    beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
      $httpBackend = _$httpBackend_;
      $httpBackend.whenGET('/timeline').respond(dataGen("3.0.1"));
      $httpBackend.whenGET("/versions").respond(allVersions);

      scope = $rootScope.$new();
      ctrl = $controller('TimelineCtrl', {$scope: scope});
    }));


    // selected versions is correct
    it('should display unique versions', function() {
      $httpBackend.flush();
      expect(scope.selectedVersion).toEqual("3.0.1");
    });

    it('should display proper subbuilds', function() {
      $httpBackend.flush();
      expect(scope.pagerBuilds).toEqual(['3.0.1-0', '3.0.1-20', '3.0.1-40', '3.0.1-60', '3.0.1-80']);
    });

  });
});
