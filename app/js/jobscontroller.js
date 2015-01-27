
var JobsCtrl = function ($scope, ViewService, Data, $location){

    $scope.data = Data;
    $scope.jobsPending = 0;
    $scope.jobsCompleted = 0;
    $scope.$watch('data.refreshJobs', function(newVal, oldVal){

        // update timeline when data has been updated
        if (newVal  == true){
            displayJobs();
            Data.refreshJobs = false;
        }

    });

    $scope.nameSort = function(el){
        return el.name;
    };

    $scope.predicate = $scope.nameSort;

    function displayJobs(){
      if($scope.runningJobs){ return; } // already running

      $scope.runningJobs = true;
      var build = Data.selectedBuildObj.Version;
      $scope.jobs = [];
      $scope.missingJobs = [];
      var dupeChecker = {};
      $scope.testsPassed = 0;
      $scope.testsTotal = 0;

      var pushToJobScope = function(response, ctx, isMissingScope){
            response.forEach(function(job){
                if (job.Bid == -1){
                  job.Bid = "";
                }
                // no double reporting
                if (job.Name in dupeChecker){
                    return;
                }
                dupeChecker[job.Name] = true;
                ctx.push({
                   "name": job.Name,
                   "passed": job.Passed,
                   "total": job.Total,
                   "result": job.Result,
                   "priority": job.Priority,
                   "url": job.Url,
                   "bid": job.Bid,
                });
                if(isMissingScope){
                    $scope.testsPending += job.Total;
                } else {
                    $scope.testsPassed += job.Passed;
                    $scope.testsTotal += job.Total;
                }
            });
      }

      var urlArgs = $location.search();
      var platforms = [];
      var categories = [];
      if ("excluded_platforms" in urlArgs){
        platforms = urlArgs.excluded_platforms.split(",");
      }
      if ("excluded_categories" in urlArgs){
        categories = urlArgs.excluded_categories.split(",")
      }

      ViewService.jobs(build, platforms, categories).then(function(response){
        pushToJobScope(response, $scope.jobs, false);
        $scope.jobsCompleted = $scope.jobs.length;

          ViewService.jobs_missing(build, platforms, categories).then(function(response){
            $scope.testsPending = 0;
            pushToJobScope(response, $scope.missingJobs, true);
            $scope.jobsPending = $scope.missingJobs.length;
            $scope.runningJobs = false;
          });
      });

    }

};
