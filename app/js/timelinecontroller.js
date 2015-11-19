angular.module('ctl.timeline', ['plotly', 'svc.timeline'])

  .controller('TimelineCtrl', ['$scope', 'QueryService', 'ViewTargets', 'selectedVersion', 
  	                          'PASS_BAR_STYLE', 'FAIL_BAR_STYLE', 'CHART_LAYOUT', 'CHART_OPTIONS',
	function($scope, QueryService, ViewTargets, selectedVersion, 
			 PASS_BAR_STYLE, FAIL_BAR_STYLE, CHART_LAYOUT, CHART_OPTIONS){

		var target = ViewTargets.currentTarget
		var passed = PASS_BAR_STYLE
		var failed = FAIL_BAR_STYLE

    $scope.data = [passed, failed];
    $scope.options = CHART_OPTIONS;
    $scope.layout = CHART_LAYOUT; 
   	$scope.layout.title = selectedVersion

    // load builds for selected versions
    QueryService.getBuilds(target, selectedVersion)
      	.then(function(builds){
				builds = builds.filter(function(b){ return (b.Passed + b.Failed) > 200})
				passed.x = failed.x = builds.map(function(b){ return b.build })
				passed.y = builds.map(function(b){ return b.Passed })
				failed.y = builds.map(function(b){ return b.Failed })
				$scope.data[0] = passed
				$scope.data[1] = failed
    	})

	}])
