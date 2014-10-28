
var CommonService = function(Data) {

    return {
        refreshSidebar: function(){

            // update url
            //$location.search("version", $scope.selectedVersion);
            //$location.search("build", selectedBuild);

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

            /*queryBreakdown(selectedBuild, platforms, categories)
              .then(function(){
              displayJobs(selectedBuild, categories, platforms);

              if(!$scope.$$phase) {
                $scope.$apply();
              }

            });*/
        }

    }

}
