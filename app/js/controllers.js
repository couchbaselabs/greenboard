//======TESTING=========
//var app = angular.module('greenboardControllers', ['greenboardServices']);
//======TESTING=========
var controllersApp = angular.module('greenboardControllers', ['nvd3ChartDirectives', 'greenboardServices']);

function lastEl(a){
  if(a.length > 0) {
    return a[a.length -1];
  } else {
    return a[0];
  }
}
controllersApp.controller('TimelineCtrl', ['$scope', 'ViewService', function ($scope, ViewService){


      // d3
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
        var total = $scope.versionBuilds[data.pointIndex].AbsPassed +
          $scope.versionBuilds[data.pointIndex].AbsFailed;
        return '<h4>' + num + ' of ' + total + ' Tests ' + key + '</h4>' +
          '<p>Build ' + build + '</p>';
      };
    };

    $scope.$on('barClick', function(event, data) {
        var build = $scope.versionBuilds[data.pointIndex].Version;
        $scope.Categories = {};
        $scope.Platforms = {};
        $scope.build = findBuildInVersions(build);
        getBreakdown(build);
    });

    $scope.xFunction = function(){
      return function(d){ return d.key; };
    };

    $scope.yFunction = function(){
      return function(d){ return d.value; };
    };

    // pagination controls
    $scope.didSelectVersion = function(version){

        $scope.selectedVersion = version;
        init(version);
    }

    // timeline controls
    var updateStatuses = function (build){

        var success = "bg-success";
        var warning = "bg-warning";
        var danger = "bg-danger";

        if ($scope.Platforms[build.Platform].Status != "greyed") {
            if ($scope.Platforms[build.Platform].Failed > 0){
              var fAbs = $scope.Platforms[build.Platform].Failed;
              var pAbs = $scope.Platforms[build.Platform].Passed;
              var fRel = 100.0*fAbs/(fAbs + pAbs);
             if (fRel > 30){
                   $scope.Platforms[build.Platform].Status = danger;
		          } else {
                   $scope.Platforms[build.Platform].Status = warning;
              }
            } else {
                $scope.Platforms[build.Platform].Status = success;
            }
        }

        if ($scope.Categories[build.Category].Status != "greyed") {
            if ($scope.Categories[build.Category].Failed > 0){
              var fAbs = $scope.Categories[build.Category].Failed;
              var pAbs = $scope.Categories[build.Category].Passed;
              var fRel = 100.0*fAbs/(fAbs + pAbs);
              if (fRel > 30){
                     $scope.Categories[build.Category].Status = danger;
              } else {
                     $scope.Categories[build.Category].Status = warning;
              }
            } else {
                $scope.Categories[build.Category].Status = success;
            }
        }

        if ($scope.build.Failed == 0){
          $scope.build.Status = success;
        } else {
            var fAbs = $scope.build.Failed;
            var pAbs = $scope.build.Passed;
            var fRel = 100.0*fAbs/(fAbs + pAbs);
          if (fRel > 30){
            $scope.build.Status = danger;
          } else {
            $scope.build.Status = warning;
          }
        }
    }

    var getTimeline = function(selectedVersion){

      var filterBy = $scope.filterBy;
      return ViewService.timeline(selectedVersion, filterBy).then(function(response){

        $scope.timelineAbsData = response.absData;
        $scope.timelineRelData = response.relData;

        $scope.allBuilds = response.allBuilds;
        $scope.versionBuilds = response.versionBuilds;
        $scope.build = lastEl($scope.versionBuilds);
        $scope.build.Passed = 0;
        $scope.build.Failed = 0;
        $scope.build.Status = "bg-success";
        return $scope.build.Version;
      });
    };

    var updateTotals = function (build){
        $scope.Categories[build.Category].Passed += build.Passed;
        $scope.Categories[build.Category].Failed += build.Failed;
        $scope.Platforms[build.Platform].Passed += build.Passed;
        $scope.Platforms[build.Platform].Failed += build.Failed;
        $scope.build.Passed += build.Passed;
        $scope.build.Failed += build.Failed;
    }

    var displayJobs = function (build, categories, platforms){


      $scope.jobs = [];
      ViewService.jobs(build, platforms, categories).then(function(response){

            response.forEach(function(job){

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


    var findBuildInVersions = function(build){

        var _build = $scope.versionBuilds.filter(function(b){
          if(b.Version == build){
            return true;
          }
        });

        return _build[0];
    }
    var getBreakdown = function(selectedBuild){

        // reset totals and setup by inclusive categories and platforms
        $scope.build.Passed = 0;
        $scope.build.Failed = 0;

        var platforms = [];
        var categories = [];
        Object.keys($scope.Categories).forEach(function(k){

          var item = $scope.Categories[k];
          item.Passed = 0;
          item.Failed = 0;
          if (item.Status != "greyed"){
            if (categories.indexOf(k) < 0){
                categories.push(k);
            }
          }
        });
        Object.keys($scope.Platforms).forEach(function(k){
          var item = $scope.Platforms[k];
          item.Passed = 0;
          item.Failed = 0;
          if (item.Status != "greyed"){
            if (platforms.indexOf(k) < 0){
                platforms.push(k);
            }
          }
        });

        // query breakdown service
        ViewService.breakdown(selectedBuild, platforms, categories).then(function(response){

          // update totals for each platform and category
          response.forEach(function(build) {

            // add in new categories
            if (!(build.Category in $scope.Categories)) {
                $scope.Categories[build.Category] = {
                    "Category": build.Category,
                    "Passed": 0,
                    "Failed": 0,
                    "Status": "bg-success",
                    "checked": "ok",
                };
            }
            if (!(build.Platform in $scope.Platforms)){
                $scope.Platforms[build.Platform] = {
                    "Platform": build.Platform,
                    "Passed": 0,
                    "Failed": 0,
                    "Status": "bg-success",
                    "checked": "ok",
                };
            }

            // totals
            updateTotals(build);

            // status bars
            updateStatuses(build);

        });

        // display jobs
        displayJobs(selectedBuild, categories, platforms);
      });
    }

    $scope.filterItem = function(key, itype){

        var selected;
        var item;
        if (itype == "c"){
            item = key.Category;
            selected = $scope.Categories[item];
        }
        else {
            item = key.Platform;
            selected = $scope.Platforms[item];
        }

        if (selected.checked == "ok"){
            selected.checked = "";
            selected.Status = "greyed";
        } else {
            selected.checked = "ok";
            selected.Status = "";
        }
        getBreakdown($scope.build.Version);
        if(!$scope.$$phase) {
          $scope.$apply();
        }

    }

    $scope.filterMenues = [{
        "title": "Total Passed",
        "key": "abspassed",
        "value": 50,
        "options": [0, 50, 100, 500]
      }, {
        "title": "Total Failed",
        "key": "absfailed",
        "value": 10,
        "options": [0, 10, 25, 50]
      }, {
        "title": "Perc. Passed",
        "key": "percpassed",
        "value": 75,
        "options": [0, 25, 50, 75]
      }, {
        "title": "Perc. Failed",
        "key": "percfailed",
        "value": 10,
        "options": [0, 10, 25, 50]
      }
    ];

    // filters
    $scope.filterBy = $scope.filterMenues[0];

    $scope.didSelectFilter = function(value){
      $scope.filterBy.value = value;
      init($scope.selectedVersion);
    };

    $scope.didSelectMenu = function(menu){
      $scope.filterBy = menu;
      init($scope.selectedVersion);
    }

    $scope.toggleFilters = function(){

    }

    var init = function(selectedVersion){
      ViewService.versions().then(function(versions){
          $scope.versions = versions;
          $scope.pagerBuilds = versions;
          if (selectedVersion){
            $scope.selectedVersion = selectedVersion;
          } else {
            $scope.selectedVersion = versions[versions.length - 1];
          }
          $scope.pagerBuildPartitions = [];
          $scope.backDisabled = true;
          $scope.showPartitions = false;
          $scope.Platforms = {};
          $scope.Categories = {};
          return $scope.selectedVersion;
      }).then(getTimeline)
        .then(getBreakdown);
    }

    // job sort var
    $scope.reverse = true;

    // init controller
    init();

  }

]);
