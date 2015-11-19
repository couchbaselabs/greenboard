'usev strict'
var app = angular.module('greenBoard', [
  'ui.router',
  'svc.data',
  'svc.view',
  'svc.query',
  'ctl.main',
  'ctl.timeline',
  'ctl.initdata',
  'ctl.sidebar',
  'ctl.jobs'
]);


app.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("/server/latest");

    $stateProvider
      .state('target', {
        url: "/:target",
        views: {
          "sidebar": {
            templateUrl: "partials/sidebar.html",
            controller: "SidebarCtrl",
          },
          "main": {
            templateUrl: "view.html",
            controller: "MainCtrl"
          }
        },
        resolve: {
          versions: ['QueryService', '$stateParams', function(QueryService, $stateParams){
            var target = $stateParams.target
            return QueryService.getVersions(target)
          }]
        }
      })
      .state('target.version', {  
        // 
        // if version is latest get Highest Version no.
        // get all builds for selected version
        // make timeline of builds based on version
        url: "/:version",
        views: {
          "timeline": {
            templateUrl: "partials/timeline.html",
            controller: "TimelineCtrl",
          }
        },
        resolve: {
          selectedVersion: ['$stateParams', 'versions', function($stateParams, versions){
            var version = $stateParams.version
            if(version == 'latest'){
              version = versions[versions.length-1]
            }
            return version
          }]
        }

      })
      /*
      .state('target.version.build', {  
        // if build is latest get Highest build no
        // jobs for build based on version
        url: "/:build_id",
        templateUrl: "partials/jobs.html",
        controller: "JobsCtrl",
        resolve:{
          jobs: ['versions', function(versions){
            console.log("jobs breakdown", versions)
            return true
          }]
        }
      })*/

  }]);


// build state is templateless with child siblings (jobs/sidebar)
// they each take in target/version/build service to setup data for their views

