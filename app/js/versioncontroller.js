angular.module('ctl.version', [])

  .controller('VersionCtrl', ['$scope', 'QueryService', 'ViewTargets', 'selectedVersion', 
	function($scope, QueryService, ViewTargets, selectedVersion){
		var target = ViewTargets.currentTarget
		$scope.data = {}
		console.log("getBuilds")

        QueryService.getBuilds(target, selectedVersion)
        	.then(function(builds){
 				$scope.builds = builds
        	})

	}])
