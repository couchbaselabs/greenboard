
var JobsCtrl = function ($scope, ViewService, Data, $location){

    $scope.data = Data;

    $scope.$watch('data.refreshJobs', function(newVal, oldVal){

        // update timeline when data has been updated
           if (newVal  == true){
            displayJobs();
            Data.refreshJobs = false;
        }

    });

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
      });

      ViewService.jobs_missing(build, [], []).then(function(response){
        pushToJobScope(response, $scope.missingJobs);
      });

    }

};
