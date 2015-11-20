angular.module('app.timeline', ['plotly'])

  .controller('TimelineCtrl', ['$scope', 'QueryService', 'Data', 
  	                          'PASS_BAR_STYLE', 'FAIL_BAR_STYLE', 'CHART_LAYOUT', 'CHART_OPTIONS',
	function($scope, QueryService, Data, 
			 PASS_BAR_STYLE, FAIL_BAR_STYLE, CHART_LAYOUT, CHART_OPTIONS){

		var passed = PASS_BAR_STYLE
		var failed = FAIL_BAR_STYLE

	    $scope.data = [passed, failed];
	    $scope.options = CHART_OPTIONS;
	    $scope.layout = CHART_LAYOUT; 

	 	$scope._data = Data

	 	// update plot data whenever selected version changes
		$scope.$watch('_data.getSelectedVersion()', function(selectedVersion){

			if(!selectedVersion){ return }

			// get target/bucket to query
			var target = Data.getCurrentTarget()

			// set plot title to selected version
		   	$scope.layout.title = selectedVersion

		    // load build data for selected versions
		    QueryService.getBuilds(target, selectedVersion)
		      	.then(function(builds){
						builds = builds.filter(function(b){ return (b.Passed + b.Failed) > 200})
						passed.x = failed.x = builds.map(function(b){ return b.build })
						passed.y = builds.map(function(b){ return b.Passed })
						failed.y = builds.map(function(b){ return b.Failed })
						$scope.data[0] = passed
						$scope.data[1] = failed
		    	})
	      })

	}])


  .value('PASS_BAR_STYLE', {x: [], y: [], 
					    type: "bar", name: "Pass",
					    marker: {color: 'rgba(59, 201, 59, 0.70)'}})
  .value('FAIL_BAR_STYLE', {x: [], y: [], 
					    type: "bar", name: "Fail",
					    marker: {color: 'rgba(222, 0, 0, 0.70)'}})
  .value('CHART_LAYOUT', {height: 300, width: 800, title: ""})
  .value('CHART_OPTIONS', {showLink: false, displayLogo: false})


