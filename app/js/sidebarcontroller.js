
var SidebarCtrl = function ($scope, ViewService, Data, $location){

    // bind scope to data factory
    $scope.data = Data;

    // local scope bindings
    $scope.showAsPerc = false;
    $scope.showAllPlatforms = true;
    $scope.showAllCategories = true;
    $scope.PlatformsList = [];
    $scope.CategoriesList = [];
    $scope.didFirstSort = false;

    $scope.orderByPerc = function(el){

        // if already sorted by perc use old order 
        if ($scope.didFirstSort){
            return el.sortOrder;
        }   
        el.sortOrder = $scope.getPerc(el)*-100;
       return el.sortOrder;

    };

    $scope.objAsList = function(obj){
        var li = []; 
        for (var key in obj) {
            li.push(obj[key]);
        }
        return li;       
    };

    var resetSidebar = function() {
        $scope.selectedVersion = Data.selectedVersion;
        $scope.build = Data.selectedBuildObj;
        $scope.build.Passed = 0;
        $scope.build.Failed = 0;
        $scope.build.Pending = 0;
        $scope.showAllPlatforms = true;
        $scope.showAllCategories = true;

        if(Data.selectedBuildObj){
            $scope.Platforms = {};
            $scope.Categories = {};

            queryBreakdown().then(function(){

                var urlArgs = $location.search();
                var needsRefresh = false;
                if ("excluded_platforms" in urlArgs){
                  needsRefresh = true;
                  var platforms = urlArgs.excluded_platforms.split(",");
                  platforms.forEach(function(p){
                    _toggleItem({'Platform': p}, 'p');
                  });
                }
                if ("excluded_categories" in urlArgs){
                  needsRefresh = true;
                  var categories = urlArgs.excluded_categories.split(",")
                  categories.forEach(function(c){
                    _toggleItem({'Category': c}, 'c');
                  });
                }

                if (needsRefresh) {
                    updateBreakdown();
                }
            });
        }
    }

    $scope.$watch('data.refreshSidebar', function(newVal, oldVal){

        // update scope when data has been updated
        if (newVal == true){
          // build is same
          resetSidebar();
          Data.refreshSidebar = false;
        } else {
            // resort for new build
            $scope.didFirstSort = false;
        }

    });

    // handle % vs # slidler action
    $scope.didClickSlider = function(){
      $scope.showAsPerc = !$scope.showAsPerc;
    }

    $scope.getPerc = function(item){
      if (!item){
        return 0;
      }

      var total = item.Passed + item.Failed;
      var denom = total + item.Pending;
      console.log(total+"/"+denom); 
      return total/denom;
    }

    var updateTotals = function (build){
        $scope.Categories[build.Category].Passed += build.Passed;
        $scope.Categories[build.Category].Failed += build.Failed;
        $scope.Categories[build.Category].Pending += build.Pending;
        $scope.Platforms[build.Platform].Passed += build.Passed;
        $scope.Platforms[build.Platform].Failed += build.Failed;
        $scope.Platforms[build.Platform].Pending += build.Pending;
        $scope.build.Passed += build.Passed;
        $scope.build.Failed += build.Failed;
        $scope.build.Pending += build.Pending;
    }

    var updateStatuses = function (build){
        
        var success = "bg-success";
        var warning = "bg-warning";
        var danger = "bg-danger";

        if ($scope.Platforms[build.Platform].Status != "greyed") {
            var fAbs = $scope.Platforms[build.Platform].Failed +
                              $scope.Platforms[build.Platform].Pending;
            if (fAbs > 0){
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

        if (($scope.Platforms[build.Platform].Passed == 0) &&
                ($scope.Platforms[build.Platform].Failed == 0)) {
            // did not run
             $scope.Platforms[build.Platform].Status = "disabled";
        }

        if ($scope.Categories[build.Category].Status != "greyed") {
          var fAbs = $scope.Categories[build.Category].Failed +
                    $scope.Categories[build.Category].Pending;
            if (fAbs > 0){
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

        if (($scope.Categories[build.Category].Passed == 0) &&
                ($scope.Categories[build.Category].Failed == 0)) {
             $scope.Categories[build.Category].Status = "disabled";
        }

        var fAbs = $scope.build.Failed + $scope.build.Pending;
        if (fAbs == 0){
          $scope.build.Status = success;
        } else {
            var pAbs = $scope.build.Passed;
            var fRel = 100.0*fAbs/(fAbs + pAbs);
          if (fRel > 30){
            $scope.build.Status = danger;
          } else {
            $scope.build.Status = warning;
          }
        }
    }

    var queryBreakdown = function(platforms, categories){

      return ViewService.breakdown(Data.selectedBuildObj.Version, platforms, categories).then(function(response){

        // update totals for each platform and category
        response.forEach(function(build) {

          // add in new categories
          if (!(build.Category in $scope.Categories)) {
              $scope.Categories[build.Category] = {
                  "Category": build.Category,
                  "Passed": 0,
                  "Failed": 0,
                  "Pending": 0,
                  "Status": "bg-success",
                  "checked": true,
              };
          }
          if (!(build.Platform in $scope.Platforms)){
              $scope.Platforms[build.Platform] = {
                  "Platform": build.Platform,
                  "Passed": 0,
                  "Failed": 0,
                  "Pending": 0,
                  "Status": "bg-success",
                  "checked": true,
              };
          }

          // totals
          updateTotals(build);

          // status bars
          updateStatuses(build);

        });

      });
    }

    var updateBreakdown = function(){

      // update url
      var selectedBuild = Data.selectedBuildObj.Version;
      $scope.build.Passed = 0;
      $scope.build.Failed = 0;
      $scope.build.Pending = 0;
      $scope.build.Status = "bg-success";

      var platforms = [];
      var categories = [];

      Object.keys($scope.Categories).forEach(function(k){

        var item = $scope.Categories[k];
        item.Passed = 0;
        item.Failed = 0;
        item.Pending = 0;
        if (item.Status == "greyed"){
          if (categories.indexOf(k) < 0){
              categories.push(k);
          }
        } else {
          item.Status = "disabled";
        }
      });
      Object.keys($scope.Platforms).forEach(function(k){
        var item = $scope.Platforms[k];
        item.Passed = 0;
        item.Failed = 0;
        item.Pending = 0;
        if (item.Status == "greyed"){
          if (platforms.indexOf(k) < 0){
              platforms.push(k);
          }
        } else {
          item.Status = "disabled";
        }
      });

      // if all platforms|categories excluded toggle showAll flags
      if (platforms.length > 0 &&
          (platforms.length == Object.keys($scope.Platforms).length)){
        $scope.showAllPlatforms = false;
      } else if(platforms.length == 0){ // exclude none
        $scope.showAllPlatforms = true;
      }

      if (categories.length > 0 &&
          (categories.length  == Object.keys($scope.Categories).length)){
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

      Data.refreshJobs = true;
      return queryBreakdown(platforms, categories);
    }



    // handle click 'all' toggle button
    $scope.toggleAll = function(itype){

        var items;
        if (itype == "c"){
            items = $scope.Categories;
            $scope.showAllCategories = !$scope.showAllCategories;
        }
        else {
            items = $scope.Platforms;
            $scope.showAllPlatforms = !$scope.showAllPlatforms;

        }

        Object.keys(items).forEach(function(item){
          var key = items[item];
          if (itype == "c"){
            key.checked = !$scope.showAllCategories;
          } else {
            key.checked = !$scope.showAllPlatforms;
          }
          _toggleItem(key, itype);

        });
        updateBreakdown();
    }


    // handle de/select individual sidebar items
    $scope.toggleItem = function(key, itype){

        // assuming after an item has been click sort has already happened
        $scope.didFirstSort = true;

        // if all items are highlighted first do a toggle all
        if (itype == "c"){
          var categories = Object.keys($scope.Categories);
          var sel = categories.filter(function(k){
            return $scope.Categories[k].checked;
          });
          if ((sel.length > 1) && (sel.length == categories.length)){
            $scope.toggleAll("c");
          }
        } else {
          var platforms = Object.keys($scope.Platforms);
          var sel = platforms.filter(function(k){
            return $scope.Platforms[k].checked;
          });
          if ((sel.length > 1) && (sel.length == platforms.length)){
            $scope.toggleAll("p");
          }
        }


        _toggleItem(key, itype);
        updateBreakdown();

    }

    function _toggleItem(key, itype){
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
        if (selected.checked){
            // toggle checked item to greyed state
            selected.Status = "greyed";
        } else {
            selected.Status = "bg-success";
        }
        selected.checked = !selected.checked;
    }

};
