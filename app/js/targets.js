angular.module('app.target', [])

  .directive('targetSelector', ['ViewTargets', 'Data',
  	function(ViewTargets, Data){
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

  .directive('filterSelector', ['Data',
    function(Data){
      return {
        restrict: 'E',
        scope: {
          changeFilter: "="
        },
        templateUrl: 'partials/filters.html',
        link: function(scope, elem, attrs){

          scope.activeFilter = Data.getBuildFilter()
          scope.passFilters = [0, 500, 2000]

          scope.changeFilter = function(f){
            scope.activeFilter = f
            Data.setBuildFilter(scope.activeFilter)
          }

          scope.$watch(function(){ return Data.getBuildFilter() },
            function(filterBy){
                scope.activeFilter = filterBy
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
	        scope.hasNext = true
          scope.hasPrevious = true
          var versionWindowSize = 5

          function setNextPrevStatus(){

            var lastGroupIndex = scope.versionGroups.length-1
            scope.hasNext = scope.groupIndex == 0 ? false:true
            scope.hasPrevious = scope.groupIndex ==  lastGroupIndex ? false:true

          }

          scope.showPrevious = function(){
            if(scope.hasPrevious){
              scope.groupIndex++ // previous is higher increment since we're reversed
              scope.targetVersions = scope.versionGroups[scope.groupIndex]
              setNextPrevStatus()
            }
          }
          scope.showNext = function(){
            if(scope.hasNext){
              scope.groupIndex--
              scope.targetVersions = scope.versionGroups[scope.groupIndex]
              setNextPrevStatus()
            }
          }

	  			scope.$watch(function(){ return Data.getSelectedVersion() }, 
            function(version){
	  			  	if(version){
                scope.version = version
                var targetVersions = _.clone(Data.getTargetVersions())
                targetVersions.reverse()
                var versionIndex = _.indexOf(targetVersions, version)

                // construct window of 5 builds
                scope.versionGroups = _.map(_.chunk(targetVersions, versionWindowSize),
                  function(group){
                    group.reverse(); return group
                })

                // figure out which group we're in
                scope.groupIndex = Math.floor(versionIndex/versionWindowSize)
                scope.targetVersions = scope.versionGroups[scope.groupIndex]


                setNextPrevStatus()
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


