angular.module('app.target', [])

  .directive('targetSelector', ['$stateParams','ViewTargets', 'Data',
  	function($stateParams, ViewTargets, Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {
	  			target: "=",
	  			changeTarget: "="
	  		},
	  		templateUrl: 'partials/targets.html',
	  		link: function(scope, elem, attrs){

	  			// watch changes from parent scope
	  			scope.$watch(attrs.target, function(target){
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
	  			version: "=",
	  			changeVersion: "="
	  		},
	  		link: function(scope, elem, attrs){
	
	  			scope.$watch(attrs.version, function(version){
	  			  	if(version){
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


