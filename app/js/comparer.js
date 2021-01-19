angular.module("app.compare", ['googlechart', 'svc.query'])
    .controller("comparer", ['$scope', '$state', 'Data', 'QueryService', 'target', 'versions', 'version1', 'version2',
        'builds1', 'builds2', 'build1', 'build2','build1details','build2details',
        function ($scope, $state, Data, QueryService, target, versions, version1, version2, builds1, builds2, build1,
                  build2, build1details, build2details) {

        var test = QueryService.getVersions(target).then(function (versions) {
            return versions;
        });
        if(!target){
            target = "server";
        }

        if (versions.length == 0){
            versions = QueryService.getVersions(target).then(function (versions) {
                return versions;
            });
        }

        if (!version1){
            version1 = versions[versions.length - 1];

        }
        if (!version2){
            version2 = versions[versions.length - 1];

        }

        if (builds1.length == 0){
            builds1 = QueryService.getBuilds(target, version1, 2000, 5).then(function (builds) {
                return builds;
            });
        }

        if (builds2.length == 0){
            builds2 = QueryService.getBuilds(target, version2, 2000, 5).then(function (builds) {
                return builds;
            });
        }

        if (!build1) {
            build1 = builds1[builds1.length - 1].build;
        }

        if (!build2){
            build2 = builds2[builds2.length  - 1].build;
        }

        if (!build1details){
            build1details = QueryService.getBuildSummary(build1).then(function (buildSummary) {
                return buildSummary;
            });
        }

        if (!build2details){
            build2details = QueryService.getBuildSummary(build2).then(function (buildSummary) {
                return buildSummary;
            })
        }

        $scope.changeCompareTarget = function (target) {
            $scope.compareTarget = target;
        };

        $scope.version1Change = function (version) {
            $scope.compareVersion1 = version;
        };

        $scope.version2Change = function (version) {
            $scope.compareVersion2 = version;
        };

        $scope.build1Change = function (build) {
            $scope.compareBuildId1 = build;
        };

        $scope.build2Change = function (build) {
            $scope.compareBuildId2 = build;
        };

        $scope.changeGraphType = function (graphType) {
            $scope.graphType = graphType;
        };

        $scope.changeOs = function (OS) {
            $scope.compareOS = OS;
        };

        $scope.$watch(function () {
            return $scope.compareTarget;
        }, function (newVal, oldVal) {
            if (newVal === oldVal){
                return;
            }
            var query = QueryService.getVersions(newVal).then(function (versions) {
                $scope.compareVersion1 = versions[versions.length - 1];
                $scope.compareVersion2 = versions[versions.length - 1];
                $scope.versions = versions;
                return versions;
            });
        });

        $scope.$watch(function () {
            return $scope.compareVersion1;
        }, function (newVal, oldVal) {
            if (newVal === oldVal){
                return;
            }
            var query = QueryService.getBuilds($scope.compareTarget, newVal, 2000, 5)
                .then(function (builds) {
                    var buildIds = _.map(_.map(builds, "build"), function (item) {
                        return item.split(['-'])[1];
                    });
                    $scope.compareBuildId1 = buildIds[buildIds.length - 1];
                    $scope.compareBuilds1 = buildIds;
                    return builds;
            });

        });

        $scope.$watch(function () {
            return $scope.compareVersion2;
        }, function (newVal, oldVal) {
            if (newVal === oldVal){
                return;
            }
            var query = QueryService.getBuilds($scope.compareTarget, newVal, 2000, 5)
                .then(function (builds) {
                    var buildIds = _.map(_.map(builds, "build"), function (item) {
                        return item.split(['-'])[1];
                    });
                    $scope.compareBuildId2 = buildIds[buildIds.length - 1];
                    $scope.compareBuilds2 = buildIds;
                    return builds;
                });
        });

        $scope.$watch(function () {
            return $scope.compareBuildId1;
        }, function (newVal, oldVal) {
            if (newVal === oldVal){
                return;
            }
            var query = QueryService.getBuildSummary($scope.compareVersion1 + "-" + newVal)
                .then(function (buildSummary) {
                $scope.osRunPercChart = getRunPercChart(buildSummary.os, build2details.os, $scope.graphType,
                    "OS", "Run %", "OS", "Total run % per OS");

                $scope.osPassPercChart = getPassPercChart(buildSummary.os, build2details.os, $scope.graphType,
                    "OS", "Pass %", "OS", "Pass % per OS");
                $scope.componentsCharts = getComponentsCharts(buildSummary.os, build2details.os);
                $scope.runPercChart = $scope.componentsCharts[$scope.compareOS].runPercChart;
                $scope.passPercChart = $scope.componentsCharts[$scope.compareOS].passPercChart;
                build1details = buildSummary;
                return buildSummary;
            });
        });

        $scope.$watch(function () {
            return $scope.compareBuildId2
        }, function (newVal, oldVal) {
            if (newVal === oldVal){
                return;
            }
            var query = QueryService.getBuildSummary($scope.compareVersion2 + "-" + newVal)
                .then(function (buildSummary) {
                $scope.osRunPercChart = getRunPercChart(build1details.os, buildSummary.os, $scope.graphType,
                    "OS", "Run %", "OS", "Total run % per OS");

                $scope.osPassPercChart = getPassPercChart(build1details.os, buildSummary.os, $scope.graphType,
                    "OS", "Pass %", "OS", "Pass % per OS");
                $scope.componentsCharts = getComponentsCharts(build1details.os, buildSummary.os);
                $scope.runPercChart = $scope.componentsCharts[$scope.compareOS].runPercChart;
                $scope.passPercChart = $scope.componentsCharts[$scope.compareOS].passPercChart;
                build2details = buildSummary;
                return buildSummary;
            });
        });

        $scope.$watch(function () {
            return $scope.graphType;
        }, function (newVal, oldVal) {
            if (newVal === oldVal){
                return;
            }
            $scope.osRunPercChart.type = newVal;
            $scope.osPassPercChart.type = newVal;
            $scope.runPercChart.type = newVal;
            $scope.passPercChart.type = newVal;
            _.forEach($scope.componentsCharts, function (value, key) {
                value.runPercChart.type = newVal;
                value.passPercChart.type = newVal;
            })
        });

        $scope.$watch(function () {
            return $scope.compareOS;
        }, function (newVal, oldVal) {
            if (newVal === oldVal){
                return;
            }
            $scope.runPercChart = $scope.componentsCharts[newVal].runPercChart;
            $scope.passPercChart = $scope.componentsCharts[newVal].passPercChart;
        });

        function getChartFormat(type, label, xaxis, yaxis, title){
            return {
                "type": type,
                "data": {
                    "cols": [
                        {
                            "id": label,
                            "label": label,
                            "type": "string",
                            "p": {}
                        },
                        {
                            "id": "build1",
                            "label": $scope.compareVersion1 + "-" + $scope.compareBuildId1,
                            "type": "number",
                            "p": {
                                "html": true
                            }
                        },
                        {
                            "id": "build2",
                            "label": $scope.compareVersion2 + "-" + $scope.compareBuildId2,
                            "type": "number",
                            "p": {
                                "html": true
                            }
                        }
                    ],
                    "rows": []
                },
                "options": {
                    "title": title,
                    "isStacked": "false",
                    "displayExactValues": true,
                    "vAxis": {
                        "title": yaxis,
                        "gridlines": {
                            "count": 5
                        }
                    },
                    "hAxis": {
                        "title": xaxis,
                        "slantedText": true,
                        "slantedTextAngle": 90,
                        "showTextEvery": 1,
                        "textStyle": {
                            "fontSize": 10
                        }
                    },
                    "bar": {
                        "groupWidth": '20%'
                    },
                    "legend": {
                        "position": "top"
                    },
                    "allowHtml": true,
                    "tooltip": {
                        "isHtml": true
                    },
                    "width": "100%",
                    "height": 500
                },
                "formatters": {
                    "color": [
                        {
                            "columnNum": 1,
                            "formats": [
                                {
                                    "from": 0,
                                    "to": 95,
                                    "color": "red"
                                },
                                {
                                    "from": 95,
                                    "to": 101,
                                    "color": "green"
                                }
                            ]
                        },
                        {
                            "columnNum": 2,
                            "formats": [
                                {
                                    "from": 0,
                                    "to": 95,
                                    "color": "red"
                                },
                                {
                                    "from": 95,
                                    "to": 101,
                                    "color": "green"
                                }
                            ]
                        }

                    ]
                }
            };
        }

        var runPercMapFunction = function (item) {
            if (!_.isObject(item)){
                return;
            }
            var runPerc = (item.totalCount / (item.totalCount + item.pending)) * 100;
            return {
                "runPerc": runPerc,
                "totalCount": item.totalCount,
                "pendingTests": item.pending
            };
        };

        var runPercChartRow = function (_build1, _build2, key) {
            if (!_.isObject(_build1) || !_.isObject(_build2)){
                return
            }
            return {
                "c": [
                    {
                        "v": key
                    },
                    {
                        "v": _.isNaN(_build1.runPerc)? 0: _build1.runPerc,
                        "f": "Run %: " + (_.isNaN(_build1.runPerc)? 0: _build1.runPerc) + "<br/>Total Test run: " +
                            _build1.totalCount + "<br/>Pending tests: " + _build1.pendingTests
                    },
                    {
                        "v": _.isNaN(_build2.runPerc)? 0: _build2.runPerc,
                        "f": "Run %: " + (_.isNaN(_build2.runPerc)? 0: _build2.runPerc) + "<br/>Total Test run: "
                            + _build2.totalCount + "<br/>Pending tests: " + _build2.pendingTests
                    }
                ]
            }
        };

        var passPercMapFunction = function (item) {
            if (!_.isObject(item)){
                return;
            }
            var passPerc = ((item.totalCount - item.failCount) / item.totalCount) * 100;
            return {
                "passPerc": passPerc,
                "passCount": item.totalCount - item.failCount,
                "failCount": item.failCount
            };
        };

        var passPercChartRow = function (_build1, _build2, key) {
            if (!_.isObject(_build1) || !_.isObject(_build2)){
                return
            }
            return {
                "c": [
                    {
                        "v": key
                    },
                    {
                        "v": _.isNaN(_build1.passPerc)? 0: _build1.passPerc,
                        "f": "Pass%: " + (_.isNaN(_build1.passPerc)? 0: _build1.passPerc) + "<br/>Passed tests: " +
                            _build1.passCount + "<br/>Failed tests: " + _build1.failCount
                    },
                    {
                        "v": _.isNaN(_build2.passPerc)? 0: _build2.passPerc,
                        "f": "Pass%: " + (_.isNaN(_build2.passPerc)? 0: _build2.passPerc) + "<br/>Passed tests: " +
                            _build2.passCount + "<br/>Failed tests: " + _build2.failCount
                    }
                ]
            }
        };

        function getRunPercChart(_build1, _build2, type, label, xaxis, yaxis, title) {
            var chart = getChartFormat(type, label, xaxis, yaxis, title);
            var build1osRunPerc = _.mapValues(_.omitBy(_build1, _.isNumber), runPercMapFunction);
            var build2osRunPerc = _.mapValues(_.omitBy(_build2, _.isNumber), runPercMapFunction);
            chart.data.rows = _.map(build1osRunPerc, function (_build1details, key) {
                var _build2details = _.get(build2osRunPerc, key, {"runPerc": 0, "totalCount": 0, "pendingTests": 0});
                return runPercChartRow(_build1details, _build2details, key);
            });
            return chart;
        }

        function getPassPercChart(_build1, _build2, type, label, xaxis, yaxis, title){
            var chart = getChartFormat(type, label, xaxis, yaxis, title);
            var build1osPassPerc = _.mapValues(_.omitBy(_build1, _.isNumber), passPercMapFunction);
            var build2osPassPerc = _.mapValues(_.omitBy(_build2, _.isNumber), passPercMapFunction);

            chart.data.rows = _.map(build1osPassPerc, function (_build1details, key) {
                var _build2details = _.get(build2osPassPerc, key, {"passPerc": 0, "passCount": 0, "failCount": 0});
                return passPercChartRow(_build1details, _build2details, key);
            });
            return chart;
        }

        function getComponentsCharts(_build1, _build2) {
            return _.mapValues(_build1, function (_build1details, key) {
                var _build2details = _.get(_build2, key);
                return {
                    "runPercChart": getRunPercChart(_build1details, _build2details,  $scope.graphType,
                        "Component for " + key, "Run %", "Component", "Runs % per component for " + key),
                    "passPercChart": getPassPercChart(_build1details, _build2details, $scope.graphType,
                        "Component for " + key, "Run %", "Component", "Pass % per component for " + key)
                };
            });
        }

        $scope.compareTargets = ["server", "mobile"];
        $scope.compareTarget = target;
        $scope.versions = versions;
        var version1 = build1.split(['-'])[0];
        $scope.compareVersion1 = $scope.versions[_.indexOf($scope.versions, version1)];
        var version2 = build2.split(['-'])[0];
        $scope.compareVersion2 = $scope.versions[_.indexOf($scope.versions, version2)];
        $scope.compareBuildId1 = build1.split(['-'])[1];
        $scope.compareBuildId2 = build2.split(['-'])[1];
        var buildIds1 = _.map(_.map(builds1, "build"), function (item) {
            return item.split(['-'])[1];
        });
        var buildIds2 = _.map(_.map(builds2, "build"), function (item) {
            return item.split(['-'])[1];
        });
        $scope.compareBuilds1 = buildIds1;
        $scope.compareBuilds2 = buildIds2;
        $scope.graphTypes = ["BarChart", "ColumnChart", "LineChart" , "Table"];
        $scope.graphType = "Table";
        $scope.osRunPercChart = getRunPercChart(build1details.os, build2details.os, $scope.graphType,
            "OS", "Run %", "OS", "Total run % per OS");
        $scope.osPassPercChart = getPassPercChart(build1details.os, build2details.os,  $scope.graphType,
            "OS", "Pass %", "OS", "Pass % per OS");
        $scope.componentsCharts = getComponentsCharts(build1details.os, build2details.os);
        $scope.compareOSs = _.keys($scope.componentsCharts);
        $scope.compareOS = "CENTOS";
        $scope.runPercChart = $scope.componentsCharts[$scope.compareOS].runPercChart;
        $scope.passPercChart = $scope.componentsCharts[$scope.compareOS].passPercChart;

    }]);
