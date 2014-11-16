
var SidebarCtrl = function ($scope, CommonService, Data){

    // bind scope to data factory
    $scope.selectedVersion = Data.selectedVersion;
    $scope.build = Data.build;
    $scope.Platforms = Data.Platforms;
    $scope.Categories = Data.Categories;
    $scope.showAllPlatforms = Data.showAllPlatforms;
    $scope.showAllCategories = Data.showAllCategories;
    $scope.showAsPerc = true;

    // handle % vs # slidler action
    $scope.didClickSlider = function(){
      $scope.showAsPerc = !$scope.showAsPerc;
    }

    // handle click 'all' toggle button
    $scope.toggleAll = function(itype){

        var items;
        if (itype == "c"){
            items = Data.Categories;
            Data.showAllCategories = !Data.showAllCategories;
        }
        else {
            items = Data.Platforms;
            Data.showAllPlatforms = !Data.showAllPlatforms;

        }

        Object.keys(items).forEach(function(item){
          var key = items[item];
          if (itype == "c"){
            key.checked = !Data.showAllCategories;
          } else {
            key.checked = !Data.showAllPlatforms;
          }
          _toggleItem(key, itype);

        });

        CommonService.refreshView();
    }


    // handle de/select individual sidebar items
    $scope.toggleItem = function(key, itype){

        // if all items are highlighted first do a toggle all
        if (itype == "c"){
          var categories = Object.keys(Data.Categories);
          var sel = categories.filter(function(k){
            return Data.Categories[k].checked;
          });
          if ((sel.length > 1) && (sel.length == categories.length)){
            $scope.toggleAll("c");
          }
        } else {
          var platforms = Object.keys(Data.Platforms);
          var sel = platforms.filter(function(k){
            return Data.Platforms[k].checked;
          });
          if ((sel.length > 1) && (sel.length == platforms.length)){
            $scope.toggleAll("p");
          }
        }

        _toggleItem(key, itype);
        CommonService.refreshView();
    }

    function _toggleItem(key, itype){
        var selected;
        var item;
        if (itype == "c"){
            item = key.Category;
            selected = Data.Categories[item];
        }
        else {
            item = key.Platform;
            selected = Data.Platforms[item];
        }
        if (selected.checked){
            // toggle checked item to greyed state
            selected.Status = "greyed";
        } else {
            selected.Status = "bg-success";
        }

        selected.checked = !selected.checked;
    }

    $scope.getPerc = function(item){
      if (!item){
        return 0;
      }

      var total = item.Passed + item.Failed;
      if ((total) == 0){
        return 0;
      }

      return item.Passed/total;
    }


};
