(function(){
    'use strict';
    angular.module('plotly', [])
        .directive('plotly', ['Data', 'PASS_BAR_STYLE',  'FAIL_BAR_STYLE', 'CHART_LAYOUT', 'CHART_OPTIONS',
            function(Data, PASS_BAR_STYLE, FAIL_BAR_STYLE, CHART_LAYOUT, CHART_OPTIONS) {
                   return {
                       restrict: 'E',
                       template: '<div></div>',
                       scope: {},
                       link: function(scope, element) {
                          var element = element[0].children[0];

                          var versionBuilds = Data.getVersionBuilds()
                          var build = Data.getBuild()

                          var passed = PASS_BAR_STYLE
                          var failed = FAIL_BAR_STYLE
                          var builds = versionBuilds.filter(function(b){ return (b.Passed + b.Failed) > 200})

                          passed.x = failed.x = builds.map(function(b){ return b.build })
                          passed.y = builds.map(function(b){ return b.Passed })
                          failed.y = builds.map(function(b){ return b.Failed })
                          var data = [passed, failed]
                          var options = CHART_OPTIONS;
                          var layout = CHART_LAYOUT;
                          layout.title = Data.getSelectedVersion()+"-"+build
                          Plotly.newPlot(element, data, layout, options);
                           /*
                           scope.$watch(function(){ return Data.getBuild() }, function(build) {

                               if (!build)
                                   return;
                              console.log(build)
                              Plotly.redraw(element);
                           }, true);*/
                       }
                   };
        }])
      .value('PASS_BAR_STYLE', {x: [], y: [], 
                  type: "bar", name: "Pass",
                  marker: {color: 'rgba(59, 201, 59, 0.70)'}})
      .value('FAIL_BAR_STYLE', {x: [], y: [], 
                  type: "bar", name: "Fail",
                  marker: {color: 'rgba(222, 0, 0, 0.70)'}})
      .value('CHART_LAYOUT', {height: 300, width: 800, title: ""})
      .value('CHART_OPTIONS', {showLink: false, displayLogo: false})

})();

'usev strict'

var app = angular.module('greenBoard', [
  'plotly',
  'ui.router',
  'svc.data',
  'svc.query',
  'app.main',
  'app.target',
]);

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
          versionBuilds: ['QueryService', 'target', 'version',
            function(QueryService, target, version){
                return QueryService.getBuilds(target, version)
            }]
        }
      })

  }]);

angular.module('svc.data', [])
    .provider('Data', [function (){

        this.versions = [];
        this.target = "server";
        this.version = null;
        this.versions = [];
        this.build = null;
        this.builds = [];

        this.$get = function(){
            _targetVersions = {}

            return {
                setTarget: function(target){
                    this.target = target
                },
                setTargetVersions: function(versions){
                    // save versions belonging to this target
                    if(this.target){
                        _targetVersions[this.target] = versions
                    }
                    this.versions = versions
                },
                setSelectedVersion: function(version){
                    this.version = version
                },
                setBuild: function(build){
                    this.build = build
                },
                setVersionBuilds: function(builds){
                    this.builds = builds
                },
                getCurrentTarget: function(){
                    return this.target
                },
                getTargetVersions: function(target){
                    // if requesting specific target lookup in cache
                    var versions = this.versions
                    if(target){
                        versions = _targetVersions[target]
                    }
                    return versions
                },
                getSelectedVersion: function(){
                    return this.version
                },
                getBuild: function(){
                    return this.build
                },
                getVersionBuilds: function(){
                    return this.builds
                }

            }
        }
}])



angular.module('app.main', [])
	.controller("NavCtrl", ['$scope', '$state', '$stateParams', 'Data', 'target', 'targetVersions', 'version',
	  function($scope, $state, $stateParams, Data, target, targetVersions, version){

		Data.setTarget(target)
		Data.setSelectedVersion(version)
		Data.setTargetVersions(targetVersions)

		// move to build state
		$state.go("target.version.build")

		// update target versions when drop down target changes
		$scope.changeTarget = function(target){
            $state.go("target.version", {target: target, version: "latest"})
		}

		// update target versions when drop down target changes
		$scope.changeVersion = function(version){
            $state.go("target.version", {version: version})
		}

	}])

	.controller('BuildCtrl', ['$scope', 'build', 'versionBuilds', 'Data',
		function($scope, build, versionBuilds, Data){
			Data.setBuild(build)
			Data.setVersionBuilds(versionBuilds)
	}])

angular.module('svc.query', [])
	.service("QueryService",['$http', 'Data',
		function($http, Data){
		  return {
			getVersions: function(target){
				var url = ["versions", target].join("/")
		        return $http({"url": url, cache: true})
		        			.then(function(response){
		        				return response.data
		        			})
			},
			getBuilds: function(target, version){
				var url = ["builds", target, version].join("/")
		        return $http({"url": url, cache: true})
		        			.then(function(response){
		        				return response.data
		        			})				
			}
		  }
		}])

angular.module('app.target', [])

  .directive('targetSelector', ['$state','ViewTargets', 'Data',
  	function($stateParams, ViewTargets, Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {
	  			changeTarget: "="
	  		},
	  		templateUrl: 'partials/targets.html',
	  		link: function(scope, elem, attrs){

	  			// watch changes from parent scope
	  			scope.$watch(function(){ return Data.getCurrentTarget() }, 
            function(target){
  	  				if(!target) { return }

  		  			// configure drop down to show all targets
  					  scope.viewTargets = ViewTargets.allTargets()

              // set currently viewed scope target
  					  scope.targetBy = ViewTargets.getTarget(target)

	  			})


	  		}
	  	}
  }])

  .directive('versionSelector', ['$stateParams', 'ViewTargets', 'QueryService', 'Data',
  	function($stateParams, ViewTargets, QueryService, Data){
	  	return {
	  		restrict: 'E',
	  		templateUrl: 'partials/versions.html',
	  		scope: {
	  			changeVersion: "="
	  		},
	  		link: function(scope, elem, attrs){
	
	  			scope.$watch(function(){ return Data.getSelectedVersion() }, 
            function(version){
	  			  	if(version){
                scope.version = version
			  			  scope.targetVersions = Data.getTargetVersions()
  			  		}
	  			})
	  		}
	  	}
  }])


  .factory('ViewTargets', ['COUCHBASE_TARGET', 'SDK_TARGET', 'MOBILE_TARGET', 
  	function (COUCHBASE_TARGET, SDK_TARGET, MOBILE_TARGET){

      var viewTargets = [COUCHBASE_TARGET, SDK_TARGET, MOBILE_TARGET]
      var targetMap = {} // reverse lookup map

      // allow reverse lookup by bucket
      viewTargets = viewTargets.map(function(t, i){
        t['i'] = i
        targetMap[t.bucket] = t
        return t
      })

      return {
            allTargets: function(){ 
            	return viewTargets
            },
            getTarget: function(target){ 
            	return targetMap[target]
            }
        }
  }])


 .value('COUCHBASE_TARGET', {
        "title": "Couchbase Server",
        "bucket": "server",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500]
  })
 .value('SDK_TARGET', {
        "title": "SDK",
        "bucket": "sdk",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500]
  })
 .value('MOBILE_TARGET', {
        "title": "Mobile",
        "bucket": "mobile",
        "key": "abspassed",
        "value": 0,
        "options": [0, 50, 100, 500]
  })


