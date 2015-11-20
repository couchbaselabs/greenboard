angular.module('svc.data', [])
    .provider('Data', [function (){

        this.versions = [];
        this.target = "server";
        this.version = null;
        this.versions = [];
        this.build = null;
        this.builds = [];

        this.$get = function(){
            _targetVersions = {}

            return {
                setTarget: function(target){
                    this.target = target
                },
                setTargetVersions: function(versions){
                    // save versions belonging to this target
                    if(this.target){
                        _targetVersions[this.target] = versions
                    }
                    this.versions = versions
                },
                setSelectedVersion: function(version){
                    this.version = version
                },
                setBuild: function(build){
                    this.build = build
                },
                setVersionBuilds: function(builds){
                    this.builds = builds
                },
                getCurrentTarget: function(){
                    return this.target
                },
                getTargetVersions: function(target){
                    // if requesting specific target lookup in cache
                    var versions = this.versions
                    if(target){
                        versions = _targetVersions[target]
                    }
                    return versions
                },
                getSelectedVersion: function(){
                    return this.version
                },
                getBuild: function(){
                    return this.build
                },
                getVersionBuilds: function(){
                    return this.builds
                }

            }
        }
}])


