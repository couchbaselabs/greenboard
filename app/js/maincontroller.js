angular.module('app.main', [])
	.controller("NavCtrl", ['$scope', '$state', '$stateParams', 'Data', 'target', 'targetVersions', 'version',
	  function($scope, $state, $stateParams, Data, target, targetVersions, version){

	  	targetVersions = _.compact(targetVersions)
		Data.setTarget(target)
		Data.setSelectedVersion(version)
		Data.setTargetVersions(targetVersions)

		// activate build state
		$state.go("target.version._.build")

		// update target versions when drop down target changes
		$scope.changeTarget = function(target){
            $state.go("target.version", {target: target, version: "latest"})
		}

		// update target versions when drop down target changes
		$scope.changeVersion = function(newVersion){
	      if(newVersion != version){ 
	         $state.go("target.version", {version: newVersion})
	      }
		}

	}])
	.controller('TimelineCtrl', ['$scope', '$state', 'versionBuilds', 'Data',
		function($scope, $state, versionBuilds, Data){
			$scope.versionBuilds = versionBuilds

			// on build change reload jobs view
			$scope.onBuildChange = function(build){
				$scope.build = build
				Data.setBuild(build)
				if(build.indexOf("-") != -1){ build = build.split("-")[1]}
				$state.go("target.version._.build", {build: build})
			}

			// when build changes update timeline title
			$scope.$watch(function(){ return Data.getBuild()},
			function(build){
			  $scope.build = build
			})

			// activate generic build state
			$state.go("target.version._.build", {build: "latest"})
	}])


	.controller('JobsCtrl', ['$scope', '$state', '$stateParams', 'Data', 'buildJobs',
		function($scope, $state, $stateParams, Data, buildJobs){

		// order by name initially
		$scope.predicate = "result"
		$scope.reverse = true
		$scope.activePanel = 0

		function updateScopeWithJobs(jobs){
			var jobsCompleted = _.reject(jobs, "result", "PENDING")
			var jobsUnstable = _.filter(jobs, "result", "UNSTABLE")
			var jobsFailed = _.filter(jobs, "result", "FAILURE")
			var jobsPending = _.filter(jobs, "result", "PENDING")

			$scope.panelTabs = [
				{title: "Jobs Completed", jobs: jobsCompleted, active: true},
				{title: "Jobs Unstable", jobs: jobsUnstable},
				{title: "Jobs Failed", jobs: jobsFailed},
				{title: "Jobs Pending", jobs: jobsPending}
			]
		}


		updateScopeWithJobs(buildJobs)
		Data.setBuildJobs(buildJobs)

		// set sidebar items from build job data
	    var allPlatforms = _.uniq(_.pluck(buildJobs, "os"))
	    	.map(function(k){
	    		return {key: k, disabled: false}
	    	})
 	    var allFeatures = _.uniq(_.pluck(buildJobs, "component"))
 	    	.map(function(k){
 	    		return {key: k, disabled: false}
 	    	})
	   	Data.setSideBarItems({platforms: allPlatforms, features: allFeatures})



	   	$scope.changePanelJobs = function(i){
	   		$scope.activePanel = i
	   	}

        $scope.msToTime = msToTime

	   	$scope.$watch(function(){ return Data.getActiveJobs() }, 
				function(activeJobs){
					if(activeJobs){
						updateScopeWithJobs(activeJobs)
					}
				})


	}])
  .directive('claimCell', ['Data', 'QueryService', function(Data, QueryService){
 	  	return {
	  		restrict: 'E',
	  		scope: {job: "="},
	  		templateUrl: 'partials/claimcell.html',
	  		link: function(scope, elem, attrs){
	  			// publish on blur
	  			scope.editClaim = false
	  			scope.saveClaim = function(){
	  				// publish
	  				var target = Data.getCurrentTarget()
	  				var name = scope.job.name
	  				var build_id = scope.job.build_id
	  				var claim = scope.job.claim
	  				QueryService.claimJob(target, name, build_id, claim)
	  					.catch(function(err){
	  						scope.job.claim = "error saving claim: "+err.err
	  					})
	  				scope.editClaim = false

	  			}
	  		}
	  	}
	  }])



	
// https://coderwall.com/p/wkdefg/converting-milliseconds-to-hh-mm-ss-mmm
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

