angular.module('app.main', [])
	.controller("NavCtrl", ['$scope', '$state', '$stateParams', 'Data', 'target', 'targetVersions', 'version',
	  function($scope, $state, $stateParams, Data, target, targetVersions, version){

		Data.setTarget(target)
		Data.setSelectedVersion(version)
		Data.setTargetVersions(targetVersions)

		// activate build state
		$state.go("target.version.build")

		// update target versions when drop down target changes
		$scope.changeTarget = function(target){
            $state.go("target.version", {target: target, version: "latest"})
		}

		// update target versions when drop down target changes
		$scope.changeVersion = function(newVersion){
                  if(newVersion != version){ 
                     $state.go("target.version", {version: newVersion, build: "latest"})
                  }
		}

	}])

	.controller('BuildCtrl', ['$scope', '$state', 'build', 'versionBuilds', 'Data',
		function($scope, $state, build, versionBuilds, Data){

			Data.setBuildFilter()
			Data.setVersionBuilds(versionBuilds)
			if (build=="latest"){
				build = Data.getLatestVersionBuild()
			}
			Data.setBuild(build)

			// activate job state
			$state.go("target.version.build.jobs")

			$scope.onChange = function(newBuild){
				newBuild = newBuild.split("-")[1]
				if(newBuild!=build){ // avoid reloading same build
					$state.go("target.version", {build: newBuild})
				}
			}
	}])



	.controller('JobsCtrl', ['$scope', 'Data', 'buildJobs',
		function($scope, Data, buildJobs){

		// order by name initially
		$scope.predicate = "claim"
		$scope.reverse = true
		$scope.activePanel = 0

		if(buildJobs.length == 0){
			return
		}

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

