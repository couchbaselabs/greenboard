'usev strict'

var app = angular.module('greenBoard', [
  'ngSanitize',
  'plotly',
  'ui.router',
  'svc.data',
  'svc.query',
  'app.main',
  'app.target',
  'app.sidebar'
]);

app.run(['$location', '$rootScope', 'Data', function($location, $rootScope, Data){

    function initUrlParams(){
      // sets data service job filter params
      // based on options passed in from url
      var params = $location.search()
      Data.setUrlParams(params)
    }

    // detect if jobs need to be filtered by url params on init
    initUrlParams()

    // preserve url params between state changes
    $rootScope.$on('$stateChangeStart', function(e, to, tp, from, fp){
      initUrlParams()
    })
}])


app.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){

    // TODO: external bootstrap with now testing build!
    $urlRouterProvider.otherwise("/server/4.1.0/latest");

    $stateProvider
      .state('target', {
        url: "/:target",
        abstract: true,
        template: '<ui-view/>',
        resolve: {
          target: ['$stateParams', function($stateParams){
              return $stateParams.target
            }],
          targetVersions: ['$stateParams', 'Data', 'QueryService',
            function($stateParams, Data, QueryService){

              var target = $stateParams.target
              var versions = Data.getTargetVersions(target)
              if(!versions){
                // get versions for Target
                versions = QueryService.getVersions(target)
              }
              return versions
          }]
        }
      })
      .state('target.version', {
        url: "/:version/:build",
        templateUrl: "view.html",
        controller: "NavCtrl",
        resolve: {
          version: ['$stateParams', '$location', 'targetVersions', 'target',
            function($stateParams, $location, targetVersions, target){

              var version = $stateParams.version
              if ((version == "latest") || targetVersions.indexOf(version) == -1){
                // uri is either latest version or some unknown version of target
                // just use latested known version of target
                version = targetVersions[targetVersions.length-1]
                $location.path(target+"/"+version)
              }
              return version
            }],
            build: ['$stateParams', function($stateParams){
              return $stateParams.build
            }]
        }
      })
      .state('target.version.build', {
        templateUrl: "partials/builds.html",
        controller: "BuildCtrl",
        resolve: {
          versionBuilds: ['QueryService', 'Data', 'target', 'version',
            function(QueryService, Data, target, version){
                var params = Data.getUrlParams()
                return QueryService.getBuilds(target, version, params)
            }]
        }
      })
      .state('target.version.build.jobs', {
        templateUrl: "partials/jobs.html",
        controller: "JobsCtrl",
        resolve: {
          buildJobs: ['QueryService', 'target', 'Data', 'version',
            function(QueryService, target, Data, version){
                var build = Data.getBuild()
                return QueryService.getJobs(build, target)
            }]
        }
      })

  }]);
