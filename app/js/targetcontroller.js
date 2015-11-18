angular.module('ctl.target', ['dir.d3', 'svc.targets'])

  .controller('TargetCtrl', ['$scope', '$location', 'ViewTargets', 
		function($scope, $location, ViewTargets){
			$scope.viewTargets = ViewTargets.getTargets

			// init to default target
			$scope.targetBy =  ViewTargets.defaultTarget
			console.log($scope.targetBy)
			//$location.search("ft", $scope.targetBy.i)

			var urlArgs = $location.search();

			// set target
			if ("ft" in urlArgs) {
			  $scope.targetBy = $scope.viewTargets[urlArgs.ft];
			  // Data.bucket = $scope.targetBy.bucket;
			}
  }])