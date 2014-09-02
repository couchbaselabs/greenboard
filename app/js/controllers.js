function DisplayJobController($scope, $http){
    $scope.headers = ["Status", "Passed", "Total", "Rate", "Job"];

    var queryResultHandler = function(data, status, headers, config){
        x=23;
    }
    var url = '/timeline';
    $http.get(url)
        .success(queryResultHandler);


}



function SidebarCtl($scope, SelectedBuild){
    x=23;
}

function Timeline($scope, $http, SelectedBuild) {
	"use strict";

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
			$scope.timelineRelData[0].values.push([build.Version, build.RelPassed]);
			$scope.timelineRelData[1].values.push([build.Version, build.RelFailed]);
			$scope.timelineAbsData[0].values.push([build.Version, build.AbsPassed]);
			$scope.timelineAbsData[1].values.push([build.Version, build.AbsFailed]);
		});

		updateBreakDown(data.length - 1);
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
		updateBreakDown(data.pointIndex);
	});

	$scope.xFunction = function(){
		return function(d){ return d.key; };
	};

	$scope.yFunction = function(){
		return function(d){ return d.value; };
	};

	var updateBreakDown = function(seq_id) {
        SelectedBuild.build = $scope.timelineData[seq_id].Version;
		$scope.build = {"Version": $scope.timelineData[seq_id].Version,
                        "Passed":  0,
                        "Failed": 0,
                        "Status": "bg-success"};

		/****************************** ByPlatform ******************************/
		var data = $scope.timelineData[seq_id].ByPlatform;
		$scope.byPlatform = [];


		Object.keys(data).forEach(function(platform) {
            var Passed = data[platform].Passed;
            var Failed = data[platform].Failed;
            var Status = "bg-success";

            if (Failed > 0){
                Status = "bg-danger";
            }
            $scope.byPlatform.push({
                "Platform": platform,
                "Passed": Passed,
                "Failed": Failed,
                "Status": Status,
                "checked": "fa-check"
            });
            $scope.build.Passed = $scope.build.Passed + Passed;
            $scope.build.Failed = $scope.build.Failed + Failed;
		});

        if ($scope.build.Failed > 0){
            $scope.build.Status = "bg-danger";
        }

		/****************************** ByCategory ******************************/
		data = $scope.timelineData[seq_id].ByCategory;
		$scope.byCategory = [];
		Object.keys(data).forEach(function(category) {

            var Passed = data[category].Passed;
            var Failed = data[category].Failed;
            var Status = "bg-success";

            if (Failed > 0){
                Status = "bg-danger";
            }

			$scope.byCategory.push({
                "Feature": category,
                "Passed": Passed,
                "Failed": Failed,
                "Status": Status
            });

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

    $scope.filterPlatform = function(index){
        var selected = $scope.byPlatform[index];
        if (selected.checked == "fa-check"){
            // toggle checked of all others
            $scope.byPlatform.forEach(function(os) {
                if (os.Platform != selected.Platform){
                    os.checked = "";
                }
            });

        } else {
            selected.checked = "fa-check";
        }
    }
}

app.factory('SelectedBuild', function(){
    return { build: "3.0.0-1173" };
});

app.controller(['DisplayJobController']);
app.controller(['Timeline']);
app.controller(['SidebarCtl']);
