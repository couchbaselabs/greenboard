
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

      var build = Data.selectedBuildObj.Version;
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
        pushToJobScope(response, $scope.jobs);
        $scope.jobsCompleted = $scope.jobs.length;
      });

      ViewService.jobs_missing(build, platforms, categories).then(function(response){
        pushToJobScope(response, $scope.missingJobs);
        $scope.jobsPending = $scope.missingJobs.length;
      });

    }

};
