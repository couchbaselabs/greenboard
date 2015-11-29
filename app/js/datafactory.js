angular.module('svc.data', [])
    .provider('Data', [function (){

        this.versions = [];
        this.target = "server";
        this.version = null;
        this.versions = [];
        this.build = null;
        this.builds = [];
        this.buildJobs = {};
        this.buildBreakdown = {};
        this.buildPlatforms = [];
        this.buildComponents = [];


        this.$get = function(){
            _targetVersions = {}
            _buildJobs = []
            _buildBreakdown = []
            _itemBitmask = null

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
                setBuildJobs: function(jobs, build){
                    build = build || this.build
                    //this.buildJobs[build] = jobs
                    _buildJobs = jobs
                },
                setBuildBreakdown: function(breakdown, build){
                    build = build || this.build
                    //this.buildBreakdown[build] = breakdown
                    _buildBreakdown = breakdown
                },
                setBuildPlatforms: function(platforms){
                    this.buildComponents = components
                },
                setBuildComponents: function(components){
                    this.buildPlatforms = platforms
                },
                getBuildPlatforms: function(){
                    return this.buildPlatforms
                },
                getBuildComponents: function(){
                    return this.buildComponents
                },
                getBuildBreakdown: function(build){
                    // todo get from cache too
                    return _buildBreakdown
                },
                getBuildJobs: function(){
                    // todo get from cache too
                    return _buildJobs
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
                    var build = this.build
                    if (build == "latest"){
                        if (this.builds.length > 0){
                            build = this.builds[this.builds.length-1]
                        }
                    }
                    // prepend with version if necessary
                    if (build && (build.indexOf("-")==-1)){
                        build = this.version+"-"+build
                    }
                    return build
                },
                getVersionBuilds: function(){
                    return this.builds
                },
                toggleItem: function(name, visible){
                    _itemBitmask=name
                },
                getItemBitmask: function(){
                    return _itemBitmask
                }

            }
        }
}])


