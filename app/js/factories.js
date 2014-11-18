var app = angular.module('greenboardFactories', ['greenboardServices']);


app.factory('Data',  [function DataFactory() {

    var api =
      { init: function(){
            this.versions = [];
            this.selectedVersion = null;
            this.versionBuilds = [];
            this.selectedBuildObj = null;
            this.timelineAbsData = [];
            this.timelineRelData = [];
            this.refreshSidebar = false;
            this.refreshTimeline = false;
            this.refreshJobs = false;
        },
        findBuildObj: function(build){

            var _build = this.versionBuilds.filter(function(b){
                if(b.Version == build){
                    return true;
                }
            });
            var rc;
            if (_build.length == 0){
                rc = this.lastVersionBuild();
            } else {
                rc = _build[0];
            }
            return rc;
        },

        lastVersionBuild: function(){
            return lastEl(this.versionBuilds);
        }
    };

    api.init();

    return api;

}]);

function lastEl(a){
  if(a.length > 0) {
    return a[a.length -1];
  } else {
    return a[0];
  }
}
