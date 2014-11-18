function lastEl(a){
  if(a.length > 0) {
    return a[a.length -1];
  } else {
    return a[0];
  }
}

var TimelineCtrl = function ($scope, ViewService, Data, $location){

    $scope.data = Data;
    $scope.activeBars = [];
    $scope.reverse = true;

    $scope.$watch('data.refreshTimeline', function(newVal, oldVal){

        // update timeline when data has been updated
           if (newVal  == true){
          resetTimeline();
          // trigger sidebar refresh
          Data.refreshTimeline = false;
        }

    });

    var resetTimeline = function(){
      $scope.timelineAbsData = Data.timelineAbsData;
      $scope.timelineRelData = Data.timelineRelData;
      clearBarOpacity();

    };



    $scope.$on('barClick', function(event, data) {
        Data.selectedBuildObj = Data.versionBuilds[data.pointIndex];
        setBarOpacity(data.pointIndex);
        $location.search("build", Data.selectedBuildObj.Version);
        Data.refreshSidebar = true;
        Data.refreshJobs = true;
        $scope.$apply();

    });

    function clearBarOpacity(){
      $scope.activeBars.forEach(function(bar){
          d3.select(bar).style("fill-opacity", function(d, i){
                      return 0.5;
              });
      });
    }

    function setBarOpacity(index){

        clearBarOpacity();
        $scope.activeBars = [];

        var len = Data.versionBuilds.length;
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
        var total = Data.versionBuilds[data.pointIndex].AbsPassed +
          Data.versionBuilds[data.pointIndex].AbsFailed;
        return '<h4>' + num + ' of ' + total + ' Tests ' + key + '</h4>' +
          '<p>Build ' + build + '</p>';
      };
    };


    $scope.xFunction = function(){
      return function(d){ return d.key; };
    };

    $scope.yFunction = function(){
      return function(d){ return d.value; };
    };

}
