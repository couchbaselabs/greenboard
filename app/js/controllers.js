function Timeline($scope, $http, SelectedBuild) {
	"use strict";

    $scope.predicate = "result";
    $scope.reverse = true;
	$http.get('/timeline').success(function(data) {
		$scope.timelineData = data;

		$scope.timelineRelData = [{
			"key": "Passed, %",
			"values": []
		}, {
			"key": "Failed, %",
			"values": []
		}];

		$scope.timelineAbsData = [{
			"key": "Passed",
			"values": []
		}, {
			"key": "Failed",
			"values": []
		}];

		data.forEach(function(build) {
			$scope.timelineRelData[0]
                .values.push([build.Version, build.RelPassed]);
			$scope.timelineRelData[1]
                .values.push([build.Version, build.RelFailed]);
			$scope.timelineAbsData[0]
                .values.push([build.Version, build.AbsPassed]);
			$scope.timelineAbsData[1]
                .values.push([build.Version, build.AbsFailed]);
		});

        var build = $scope.timelineData[data.length - 1].Version;
        showBuild(build);
	});


	var format = d3.format('f');
	$scope.yAxisTickFormatFunction = function(){
		return function(d) {
			return format(Math.abs(d));
		};
	};

	$scope.relToolTipContentFunction = function() {
		return function(key, build, num) {
			return '<h4>' + num + '% Tests ' + key.replace(', %', '') + '</h4>' +
				'<p>Build ' + build + '</p>';
		};
	};

	$scope.absToolTipContentFunction = function() {
		return function(key, build, num, data) {
			var total = $scope.timelineData[data.pointIndex].AbsPassed -
				$scope.timelineData[data.pointIndex].AbsFailed;
			return '<h4>' + num + ' of ' + total + ' Tests ' + key + '</h4>' +
				'<p>Build ' + build + '</p>';
		};
	};

	$scope.$on('barClick', function(event, data) {
        var build = $scope.timelineData[data.pointIndex].Version;
		showBuild(build);
	});

	$scope.xFunction = function(){
		return function(d){ return d.key; };
	};

	$scope.yFunction = function(){
		return function(d){ return d.value; };
	};

    var showBuild = function(build){
        $scope.build = {"Version": build,
                        "Passed" : 0,
                        "Failed" : 0,
                        "Status" : "bg-success"};
        $scope.byCategory = {};
        $scope.byPlatform = {};
		updateBreakDown();
    }

    var resetTotals = function() {
        $scope.build.Passed = 0;
        $scope.build.Failed = 0;
        Object.keys($scope.byCategory).forEach(function(k){
            $scope.byCategory[k].Passed = 0;
            $scope.byCategory[k].Failed = 0;
        });
        Object.keys($scope.byPlatform).forEach(function(k){
            $scope.byPlatform[k].Passed = 0;
            $scope.byPlatform[k].Failed = 0;
        });
    }


    var displayJobs = function (categories, platforms){

        $scope.jobs = [];
        $http.get('/jobs', {
                params: { build: $scope.build.Version,
                          categories: categories.toString(),
                          platforms: platforms.toString()}
        }).success(function(data) {
            data.forEach(function(job){

                $scope.jobs.push({
                   "name": job.Name,
                   "passed": job.Passed,
                   "total": job.Total,
                   "result": job.Result,
                   "priority": job.Priority,
                   "url": job.Url,
                   "bid": job.Bid,
                });
            });
        });

    }

    var updateStatuses = function (build){

        var danger = "bg-danger";
        var success = "bg-success";

        if ($scope.byPlatform[build.Platform].Status != "greyed") {
            if ($scope.byPlatform[build.Platform].Failed > 0){
                $scope.byPlatform[build.Platform].Status = danger;
            } else {
                $scope.byPlatform[build.Platform].Status = success;
            }
        }

        if ($scope.byCategory[build.Category].Status != "greyed") {
            if ($scope.byCategory[build.Category].Failed > 0){
                $scope.byCategory[build.Category].Status = danger;
            } else {
                $scope.byCategory[build.Category].Status = success;
            }
        }

        if ($scope.build.Failed > 0){
            $scope.build.Status = danger;
        } else {
            $scope.build.Status = success;
        }
    }

    var updateTotals = function (build){
        $scope.byCategory[build.Category].Passed += build.Passed;
        $scope.byCategory[build.Category].Failed += build.Failed;
        $scope.byPlatform[build.Platform].Passed += build.Passed;
        $scope.byPlatform[build.Platform].Failed += build.Failed;
        $scope.build.Passed += build.Passed;
        $scope.build.Failed += build.Failed;
    }

	var updateBreakDown = function() {

        resetTotals();
        $http.get('/breakdown', {
                params: { build : $scope.build.Version}
        }).success(function(data) {

            var categories = [];
            var platforms = [];

            data.forEach(function(build) {

                if (build.Category in $scope.byCategory) {
                    if ($scope.byCategory[build.Category].Status == "greyed"){
                        updateStatuses(build);
                        return;
                    }
                } else {
                    $scope.byCategory[build.Category] = {
                        "Category": build.Category,
                        "Passed": 0,
                        "Failed": 0,
                        "Status": "bg-success",
                        "checked": "fa-check",
                    };
                }
                if (categories.indexOf(build.Category) < 0){
                    categories.push(build.Category);
                }
                if (build.Platform in $scope.byPlatform){
                    if ($scope.byPlatform[build.Platform].Status == "greyed"){
                        updateStatuses(build);
                        return;
                    }
                } else {
                    $scope.byPlatform[build.Platform] = {
                        "Platform": build.Platform,
                        "Passed": 0,
                        "Failed": 0,
                        "Status": "bg-success",
                        "checked": "fa-check",
                    };
                }

                if (platforms.indexOf(build.Platform) < 0){
                    platforms.push(build.Platform);
                }
                // totals
                updateTotals(build);

                // status bars
                updateStatuses(build);

            });

            // display jobs
            displayJobs(categories, platforms);

        });


		if(!$scope.$$phase) {
			$scope.$apply();
		}
	};

	$scope.breakdownToolTipContentFunction = function() {
		return function(status, num) {
			return '<h4>' + parseInt(num, 10) + ' Tests ' + status + '</h4>' +
				'<p>Build ' + $scope.build + '</p>';
		};
	};

    $scope.filterItem= function(key, itype){

        var selected;
        var item;
        if (itype == "c"){
            item = key.Category;
            selected = $scope.byCategory[item];
        }
        else {
            item = key.Platform;
            selected = $scope.byPlatform[item];
        }

        if (selected.checked == "fa-check"){
            selected.checked = "";
            selected.Status = "greyed";
        } else {
            selected.checked = "fa-check";
            selected.Status = "";
        }
        updateBreakDown();
		if(!$scope.$$phase) {
			$scope.$apply();
		}

    }
}

app.factory('SelectedBuild', function(){
    return { build: "3.0.0-1173" };
});

app.controller(['Timeline']);
