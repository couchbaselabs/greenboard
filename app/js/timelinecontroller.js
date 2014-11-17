function lastEl(a){
  if(a.length > 0) {
    return a[a.length -1];
  } else {
    return a[0];
  }
}

var TimelineCtrl = function ($scope, ViewService, Data, $location){


      // d3
     var format = d3.format('f');
    $scope.yAxisTickFormatFunction = function(){
      return function(d) {
        return format(Math.abs(d));
      };
    };

    $scope.relToolTipContentFunction = function() {
      return function(key, build, num) {
        return '<h4>' + num + '% ' + key.replace(', %', '') + '</h4>' +
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

/*
    var showTimeline = function(selectedVersion){

      var filterBy = $scope.filterBy;
      var endVersion = nextVersion(selectedVersion);
      return ViewService.timeline(selectedVersion, filterBy, endVersion).then(function(response){

        if (response.allBuilds.length > 0 && response.versionBuilds.length == 0){

            // try a lower filter when data exists but is being excluded
            var options = $scope.filterBy.options;
            var filterIdx = options.indexOf($scope.filterBy.value);
            if (filterIdx > 0){
              $scope.filterBy.value = options[filterIdx - 1];
              $location.search("fv", $scope.filterBy.value);
              return getTimeline(selectedVersion);
            }
        }

        $scope.timelineAbsData = response.absData;
        $scope.timelineRelData = response.relData;

        $scope.allBuilds = response.allBuilds;
        $scope.versionBuilds = response.versionBuilds;
        Data.build = lastEl($scope.versionBuilds);
        Data.build.Passed = 0;
        Data.build.Failed = 0;
        $scope.build.Status = "bg-success";
        return $scope.build.Version;
      });
    };


/*
    function prepareForChangeBuildEvent(build){
        //Data.Categories = {};
        //Data.Platforms = {};
        $scope.showAllPlatforms = true;
        $scope.showAllCategories = true;
        $scope.build = findBuildInVersions(build);
    }

    function setBarOpacity(index){

        // clear old opacity
        $scope.activeBars.forEach(function(bar){
            d3.select(bar).style("fill-opacity", function(d, i){
                        return 0.5;
                });
        });
        $scope.activeBars = [];

        var len = $scope.versionBuilds.length;
        var bars = d3.selectAll("#absTimeline rect.nv-bar")[0]
        $scope.activeBars.push(bars[index]);
        $scope.activeBars.push(bars[index + len]);

         // set active opacity
         $scope.activeBars.forEach(function(bar){
             d3.select(bar).style("fill-opacity", function(d, i){
                         return 1;
                 });
         });

        var bars = d3.selectAll("#relTimeline rect.nv-bar")[0]
        $scope.activeBars.push(bars[index]);
        $scope.activeBars.push(bars[index + len]);
        $scope.activeBars.push(bars[index + 2*len]);

        // set active opacity
        $scope.activeBars.forEach(function(bar){
            d3.select(bar).style("fill-opacity", function(d, i){
                        return 1;
                });
        });

    }

    $scope.$on('barClick', function(event, data) {
        var build = $scope.versionBuilds[data.pointIndex].Version;
        prepareForChangeBuildEvent(build);
        getBreakdown(build);
        setBarOpacity(data.pointIndex);


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
        initFilters();
        reflectFilterLocation();
        init(version);
    }

    // timeline controls
    var updateStatuses = function (build){

        var success = "bg-success";
        var warning = "bg-warning";
        var danger = "bg-danger";

        if (Data.Platforms[build.Platform].Status != "greyed") {
            if (Data.Platforms[build.Platform].Failed > 0){
              var fAbs = Data.Platforms[build.Platform].Failed;
              var pAbs = Data.Platforms[build.Platform].Passed;
              var fRel = 100.0*fAbs/(fAbs + pAbs);
             if (fRel > 30){
                   Data.Platforms[build.Platform].Status = danger;
		          } else {
                   Data.Platforms[build.Platform].Status = warning;
              }
            } else {
                Data.Platforms[build.Platform].Status = success;
            }
        }

        if (Data.Categories[build.Category].Status != "greyed") {
            if (Data.Categories[build.Category].Failed > 0){
              var fAbs = Data.Categories[build.Category].Failed;
              var pAbs = Data.Categories[build.Category].Passed;
              var fRel = 100.0*fAbs/(fAbs + pAbs);
              if (fRel > 30){
                     Data.Categories[build.Category].Status = danger;
              } else {
                     Data.Categories[build.Category].Status = warning;
              }
            } else {
                Data.Categories[build.Category].Status = success;
            }
        }

        if (Data.build.Failed == 0){
          $scope.build.Status = success;
        } else {
            var fAbs = Data.build.Failed;
            var pAbs = Data.build.Passed;
            var fRel = 100.0*fAbs/(fAbs + pAbs);
          if (fRel > 30){
            $scope.build.Status = danger;
          } else {
            $scope.build.Status = warning;
          }
        }
    }

    var nextVersion = function(version){
        var next;
        var idx = $scope.versions.indexOf(version);
        if ((idx > -1) && (idx < ($scope.versions.length - 1))){
            next = $scope.versions[idx + 1];
        }
        return next;
    }

    var getTimeline = function(selectedVersion){

      var filterBy = $scope.filterBy;
      var endVersion = nextVersion(selectedVersion);
      return ViewService.timeline(selectedVersion, filterBy, endVersion).then(function(response){

        if (response.allBuilds.length > 0 && response.versionBuilds.length == 0){

            // try a lower filter when data exists but is being excluded
            var options = $scope.filterBy.options;
            var filterIdx = options.indexOf($scope.filterBy.value);
            if (filterIdx > 0){
              $scope.filterBy.value = options[filterIdx - 1];
              $location.search("fv", $scope.filterBy.value);
              return getTimeline(selectedVersion);
            }
        }

        $scope.timelineAbsData = response.absData;
        $scope.timelineRelData = response.relData;

        $scope.allBuilds = response.allBuilds;
        $scope.versionBuilds = response.versionBuilds;
        Data.build = lastEl($scope.versionBuilds);
        Data.build.Passed = 0;
        Data.build.Failed = 0;
        $scope.build.Status = "bg-success";
        return $scope.build.Version;
      });
    };

    var updateTotals = function (build){
        Data.Categories[build.Category].Passed += build.Passed;
        Data.Categories[build.Category].Failed += build.Failed;
        Data.Categories[build.Category].Perc =
        Data.Platforms[build.Platform].Passed += build.Passed;
        Data.Platforms[build.Platform].Failed += build.Failed;
        Data.build.Passed += build.Passed;
        Data.build.Failed += build.Failed;
    }


    var displayJobs = function (build, categories, platforms){


      $scope.jobs = [];
      $scope.missingJobs = [];

      var pushToJobScope = function(response, ctx){
            response.forEach(function(job){
                if (job.Bid == -1){
                  job.Bid = "";
                }
                ctx.push({
                   "name": job.Name,
                   "passed": job.Passed,
                   "total": job.Total,
                   "result": job.Result,
                   "priority": job.Priority,
                   "url": job.Url,
                   "bid": job.Bid,
                });
            });
      }

      ViewService.jobs(build, platforms, categories).then(function(response){
        pushToJobScope(response, $scope.jobs);
      });

      ViewService.jobs_missing(build, [], []).then(function(response){
        pushToJobScope(response, $scope.missingJobs);
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

    var queryBreakdown = function(selectedBuild, platforms, categories){

      return ViewService.breakdown(selectedBuild, platforms, categories).then(function(response){

        // update totals for each platform and category
        response.forEach(function(build) {

          // add in new categories
          if (!(build.Category in Data.Categories)) {
              Data.Categories[build.Category] = {
                  "Category": build.Category,
                  "Passed": 0,
                  "Failed": 0,
                  "Status": "bg-success",
                  "checked": true,
              };
          }
          if (!(build.Platform in Data.Platforms)){
              Data.Platforms[build.Platform] = {
                  "Platform": build.Platform,
                  "Passed": 0,
                  "Failed": 0,
                  "Status": "bg-success",
                  "checked": true,
              };
          }

          // totals
          updateTotals(build);

          // status bars
          updateStatuses(build);

          });
        return true;
      });
    }

    var getBreakdown = function(selectedBuild){


        // update url
        $location.search("version", $scope.selectedVersion);
        $location.search("build", selectedBuild);

        // reset totals and setup by inclusive categories and platforms
        Data.build.Passed = 0;
        Data.build.Failed = 0;
        $scope.build.Status = "bg-success";

        var  platforms = [];
        var categories = [];

        Object.keys(Data.Categories).forEach(function(k){

          var item = Data.Categories[k];
          item.Passed = 0;
          item.Failed = 0;
          if (item.Status == "greyed"){
            if (categories.indexOf(k) < 0){
                categories.push(k);
            }
          } else {
            item.Status = "bg-success";
          }
        });
        Object.keys(Data.Platforms).forEach(function(k){
          var item = Data.Platforms[k];
          item.Passed = 0;
          item.Failed = 0;
          if (item.Status == "greyed"){
            if (platforms.indexOf(k) < 0){
                platforms.push(k);
            }
          } else {
            item.Status = "bg-success";
          }
        });

        // if all platforms|categories excluded toggle showAll flags
        if (platforms.length > 0 &&
            (platforms.length == Object.keys(Data.Platforms).length)){
          $scope.showAllPlatforms = false;
        } else if(platforms.length == 0){ // exclude none
          $scope.showAllPlatforms = true;
        }

        if (categories.length > 0 &&
            (categories.length  == Object.keys(Data.Categories).length)){
          $scope.showAllCategories = false;
        } else if(categories.length == 0){
          $scope.showAllCategories = true;
        }

        var platformParam = null;
        var categoryParam = null;
        if (platforms.length > 0){
          platformParam =  platforms.toString();
        }
        if (categories.length > 0){
          categoryParam = categories.toString();
        }
        $location.search("excluded_platforms", platformParam);
        $location.search("excluded_categories", categoryParam);

        queryBreakdown(selectedBuild, platforms, categories)
          .then(function(){
          displayJobs(selectedBuild, categories, platforms);

          if(!$scope.$$phase) {
            $scope.$apply();
          }

        });
    }



    function initFilters(){

      $scope.filterMenues = [{
          "title": "Total Passed",
          "key": "abspassed",
          "value": 100,
          "options": [0, 50, 100, 500],
          "i": 0
        }, {
          "title": "Total Failed",
          "key": "absfailed",
          "value": 25,
          "options": [0, 10, 25, 50],
          "i": 1
        }, {
          "title": "Perc. Passed",
          "key": "percpassed",
          "value": 75,
          "options": [0, 25, 50, 75],
          "i": 2
        }, {
          "title": "Perc. Failed",
          "key": "percfailed",
          "value": 10,
          "options": [0, 10, 25, 50],
          "i": 3
        }
      ];

      // filters
      $scope.filterBy = $scope.filterMenues[0];
    }

    function initTargets(){

      $scope.viewTargets = [{
          "title": "Couchbase Server",
          "key": "abspassed",
          "value": 100,
          "options": [0, 50, 100, 500],
          "i": 0
        }, {
          "title": "Mobile",
          "key": "absfailed",
          "value": 25,
          "options": [0, 10, 25, 50],
          "i": 1
        }, {
          "title": "SDK Tools",
          "key": "percpassed",
          "value": 75,
          "options": [0, 25, 50, 75],
          "i": 2
        }
      ];

      // filters
      $scope.targetBy = $scope.viewTargets[0];
    }

    function reflectFilterLocation(){
      $location.search("fi", $scope.filterBy.i);
      $location.search("fv", $scope.filterBy.value);
    }


    $scope.didSelectFilter = function(value){
      $scope.filterBy.value = value;
      reflectFilterLocation();
      init($scope.selectedVersion);
    };

    $scope.didSelectMenu = function(menu){
      $scope.filterBy = menu;
      reflectFilterLocation();
      init($scope.selectedVersion);
    }


    var initVersion = function(selectedVersion){
      return ViewService.versions().then(function(versions){
          $scope.versions = versions;
          $scope.pagerBuilds = versions;
          if (selectedVersion){
            $scope.selectedVersion = selectedVersion;
          } else {
            $scope.selectedVersion = versions[versions.length - 1];
          }

          Data.selectedVersion = $scope.selectedVersion;
          $scope.pagerBuildPartitions = [];
          $scope.backDisabled = true;
          $scope.showPartitions = false;
          $scope.showAllPlatforms = true;
          $scope.showAllCategories = true;
          return $scope.selectedVersion;
      })
    }
    var init = function(selectedVersion){
      // init controller
      initVersion(selectedVersion)
        .then(getTimeline)
        .then(getBreakdown);
    }


    // init global state
    initFilters();
    initTargets();
    $scope.reverse = true;
    $scope.activeBars = [];

    var urlArgs = $location.search();

    if ("version" in urlArgs){
      if ("build" in urlArgs){

        if (("fi" in urlArgs) && ("fv" in urlArgs)){
          $scope.filterBy = $scope.filterMenues[urlArgs.fi];
          $scope.filterBy.value = urlArgs.fv;
        } else {
          $scope.filterBy.value = 0;
        }
        reflectFilterLocation();

        initVersion(urlArgs.version)
          .then(getTimeline)
          .then(function(){

            var defaultBuild = $scope.build;
            prepareForChangeBuildEvent(urlArgs.build);
            if(!$scope.build) {
              $scope.build = defaultBuild;
            }


            // load initial view
            queryBreakdown($scope.build.Version, [], [])
              .then(function(){
                // filter excluded items
                if ("excluded_platforms" in urlArgs){
                  var platforms = urlArgs.excluded_platforms.split(",");
                  platforms.forEach(function(p){
                    _toggleItem({'Platform': p}, 'p');
                  });
                }
                if ("excluded_categories" in urlArgs){
                  var categories = urlArgs.excluded_categories.split(",")
                  categories.forEach(function(c){
                    _toggleItem({'Category': c}, 'c');
                  });
                }
                getBreakdown($scope.build.Version);
            });
          });
      } else {
        $scope.didSelectVersion(urlArgs.version);
      }
    } else {
      $location.path("home");
      init();
      reflectFilterLocation();
    }

*/
}
