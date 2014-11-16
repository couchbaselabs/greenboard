var CommonService = function(ViewService, Data) {

    var updateTotals = function (build){
        Data.Categories[build.Category].Passed += build.Passed;
        Data.Categories[build.Category].Failed += build.Failed;
        Data.Categories[build.Category].Perc =
        Data.Platforms[build.Platform].Passed += build.Passed;
        Data.Platforms[build.Platform].Failed += build.Failed;
        Data.build.Passed += build.Passed;
        Data.build.Failed += build.Failed;
    }

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
          Data.build.Status = success;
        } else {
            var fAbs = Data.build.Failed;
            var pAbs = Data.build.Passed;
            var fRel = 100.0*fAbs/(fAbs + pAbs);
          if (fRel > 30){
            Data.build.Status = danger;
          } else {
            Data.build.Status = warning;
          }
        }
    }

    // use view service to get updated jobs for displayed platforms/categories
    var displayJobs = function (categories, platforms){


      /*$scope.jobs = [];
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

      var selectedVersion = Data.build.Version;
      ViewService.jobs(selectedVersion, platforms, categories).then(function(response){
        pushToJobScope(response, $scope.jobs);
      });

      ViewService.jobs_missing(selectedVersion, [], []).then(function(response){
        pushToJobScope(response, $scope.missingJobs);
      });
      */

    }


    // use view service to get updated stats for displayed platforms and categories
    var queryBreakdown = function(platforms, categories){

      var selectedVersion = Data.build.Version;

      // returns a promis
      return ViewService.breakdown(selectedVersion, platforms, categories)
        .then(function(response){

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

    // service api
    return {
        refreshView: function(){

            // update url
            //$location.search("version", $scope.selectedVersion);
            //$location.search("build", selectedBuild);

            // reset totals and setup by inclusive categories and platforms
            Data.build.Passed = 0;
            Data.build.Failed = 0;
            Data.build.Status = "bg-success";

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
              Data.showAllPlatforms = false;
            } else if(platforms.length == 0){ // exclude none
              Data.showAllPlatforms = true;
            }

            if (categories.length > 0 &&
                (categories.length  == Object.keys(Data.Categories).length)){
              Data.showAllCategories = false;
            } else if(categories.length == 0){
              Data.showAllCategories = true;
            }

            var platformParam = null;
            var categoryParam = null;
            if (platforms.length > 0){
              platformParam =  platforms.toString();
            }
            if (categories.length > 0){
              categoryParam = categories.toString();
            }

            //$location.search("excluded_platforms", platformParam);
            //$location.search("excluded_categories", categoryParam);

            queryBreakdown(platforms, categories)
              .then(function(){
                  displayJobs(categories, platforms);

                  //if(!$scope.$$phase) {
                  //  $scope.$apply();
                  //}

            });
        }

    }

}
