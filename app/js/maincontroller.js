angular.module('ctrl.main', [])
	.controller("MainCtrl", ['$scope', '$stateParams', 'Data', 'QueryService',
		function($scope, $stateParams, Data, QueryService){

		function loadTargetVersions(target){
			$scope.target = target
			Data.setTarget($scope.target)

			// get versions for Target
			QueryService.getVersions($scope.target)
				.then(function(versions){
		            // set selected version of all versions for target
					var version = $stateParams.version
		            if(version == 'latest'){
		              $scope.version = versions[versions.length-1]
		            } else {
		              $scope.version = version
		            }

					// update version info in shared data service
		            Data.setTargetVersions(versions)
		            Data.setSelectedVersion($scope.version)
		        })
		}

		// update target versions when drop down target changes
		$scope.changeTarget = function(target){
			loadTargetVersions(target)
		}

		// change version and update builds for version
		$scope.changeVersion = function(version){
			$scope.version = version
			Data.setSelectedVersion($scope.version)
		}

		// initialize ui with url target param
		loadTargetVersions($stateParams.target)
	}])
