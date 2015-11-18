angular.module('ctl.main', ['svc.targets'])

  .controller('MainCtrl', ['$scope', '$location', '$stateParams', 'ViewTargets', 'Data', 'versions',
	function($scope, $location, $stateParams, ViewTargets, Data, versions){
		var urlTarget = $stateParams.target
		$scope.targetBy = ViewTargets.getTarget(urlTarget)
		ViewTargets.setTarget(urlTarget)

		// setup initial view targets
		$scope.viewTargets = ViewTargets.allTargets()
		$scope.pagerVersions = versions

		
		Data.setBucket(urlTarget)

  }])