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
