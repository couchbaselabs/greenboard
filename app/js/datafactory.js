angular.module('app.datafactory', ['greenboardServices'])
.provider('Data', [function (){
    this.versions = [];
    this.bucket = "server";
    this.selectedVersion = null;
    this.versionBuilds = [];
    this.selectedBuildObj = null;
    this.timelineAbsData = [];
    this.timelineRelData = [];
    this.refreshSidebar = false;
    this.refreshTimeline = false;
    this.refreshJobs = false;    

    this.$get = function(){
        return {
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
            bucket: "server",
            lastVersionBuild: function(){
                return lastEl(this.versionBuilds);
            },
            knownPlatforms: [],
            knownCategories: []
        }
    }
}])


function lastEl(a){
  if(a.length > 0) {
    return a[a.length -1];
  } else {
    return a[0];
  }
}