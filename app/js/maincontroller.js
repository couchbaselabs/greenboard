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
		$scope.changeVersion = function(version){
            $state.go("target.version", {version: version, build: "latest"})
		}

	}])

	.controller('BuildCtrl', ['$scope', '$state', 'build', 'versionBuilds', 'Data',
		function($scope, $state, build, versionBuilds, Data){


			Data.setVersionBuilds(versionBuilds)
			if (build=="latest"){
				if (versionBuilds.length>0){
					build = versionBuilds[versionBuilds.length-1].build
				}
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



	.controller('JobsCtrl', ['$scope', '$state', 'Data', 'buildJobs',
		function($scope, $state, Data, buildJobs){
			
			if(buildJobs.length == 0){
				return
			}

			Data.setBuildJobs(buildJobs)
			$scope.jobs = buildJobs


			// map reduce helper method
			function mapReduceValues(arr){
				return _.mapValues(arr, function(values, key){
					var total = _.sum(_.pluck(values, "totalCount"))
					var fail = _.sum(_.pluck(values, "failCount"))
					return {
						    key: key,
							Passed: total - fail,
					        Failed:  fail,
					        Pending: _.sum(_.pluck(values, "pending"))
					     }
				})
			}
	
			// produce breakdown for sidebar
			var osBreakdown = _.groupBy(buildJobs, 'os')
			var osTotals = mapReduceValues(osBreakdown)
			var componentBreakdown = _.groupBy(buildJobs, 'component')
			var componentTotals = mapReduceValues(componentBreakdown) 


			// overall totals can be produced from osTotals
			var osTotalsValues = _.values(osTotals)
			var buildBreakdown = _.reduce(osTotalsValues, function(result, val){
				return {
					Passed: result["Passed"]+val["Passed"],
					Failed: result["Failed"]+val["Failed"],
					Pending: result["Pending"]+val["Pending"]
				}
			})
			buildBreakdown["Platforms"] = osTotalsValues,
			buildBreakdown["Features"] = _.values(componentTotals)
			Data.setBuildBreakdown(buildBreakdown)

			$scope.msToTime = msToTime
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

