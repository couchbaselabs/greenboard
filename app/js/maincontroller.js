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

		var allPlatforms = _.uniq(_.pluck(buildJobs, "os"))
		var allComponents = _.uniq(_.pluck(buildJobs, "component"))

	 	function processJobs(buildJobs){
			$scope.jobs = buildJobs

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
			}) || {}

			buildBreakdown["Platforms"] = osTotalsValues,
			buildBreakdown["Features"] = _.values(componentTotals)


			// add excluded items
			function appendExcluded(arr, key){
				arr.forEach(function(p){
					buildBreakdown[key].push({
						key: p,
						Passed: 0,
						Failed: 0,
						Pending: 0,
						disabled: true
					})
				})
			}

			// get known keys
			var knownOsItems =  _.keys(osTotals)
			var knownComponentItems = _.keys(componentTotals)

			// get keys that are deselected and excluded from view
			var excludedPlatforms = _.difference(allPlatforms, knownOsItems)
			var excludedComponents = _.difference(allComponents, knownComponentItems)
			appendExcluded(excludedPlatforms, "Platforms")
			appendExcluded(excludedComponents, "Features")


			Data.dropFromEncluded(excludedPlatforms.concat(excludedComponents))

			// set build breakdown to be consumed by sidebar
			Data.setBuildBreakdown(buildBreakdown)
			$scope.msToTime = msToTime
		}

	    // watch changes to sidebar bitmask
	    $scope.$watch(function(){ return Data.getSidebarFlag() },
	    	function(flags){
	    		if(!flags.length){return}  // ignore null case


	    		var includedItems = Data.getIncludedItems()
	    		var dataJobs = Data.getBuildJobs()
	    		var implicitDeselect = null

	    		var includeItem = flags[0]
	    		var itemName = flags[1]

	    		function rejectNonMatching(jobs, names, invert){
	    			// reject any job that doesn't match os or component
	    			return _.reject(jobs, 
			    				function(j){
					    			var isOsIncluded = (names.indexOf(j.os) > -1)
					    			var isComponentIncluded = (names.indexOf(j.component) > -1)
					    			// when component matches, the os must be in included items
					    			if (isComponentIncluded){
					    				if(includedItems.indexOf(j.os) == -1){
					    					isComponentIncluded = false
					    				}
					    			}
					    			if (invert){
					    				return (isOsIncluded || isComponentIncluded)
					    			} else {
						    			return (!isOsIncluded  && !isComponentIncluded)
						    		}
				    		})	
	    		}

	    		if(includeItem){
	    			if(itemName){
	    				// add jobs matching to itemName to current scope
	    				var itemJobs = rejectNonMatching(dataJobs, [itemName], false, true)
	    				console.log(itemJobs, includedItems)
	    				dataJobs = $scope.jobs.concat(itemJobs)
		    		} else {
		    			// special case of initial filtering all by included items
		    			dataJobs = rejectNonMatching(dataJobs, includedItems)
		    		}
	    		} else if(itemName) {
	    			// do inverted matching to remove from current scope
	    			// *matching* instead of the default non matching
	    		    dataJobs = rejectNonMatching($scope.jobs, [itemName], true)
	    		} else {
	    			console.log(includedItems)
	    			// remove from current list of visible jobs using included items
	    			dataJobs = rejectNonMatching($scope.jobs, includedItems)	    			
	    		}

				console.log("Process: "+flags)
	    		processJobs(dataJobs)
	    	})


		// cache  build job info
		Data.setBuildJobs(buildJobs)

	   	// initial processing of jobs
		processJobs(buildJobs)

	}])

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

