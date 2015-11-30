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
            _includeItems = []
            _excludedItems = []

            // sidebar flag
            // index.0 = (true) if item is to be included, (false) if removed
            // index.1 = (name) of item (null implies use included items)
            _sideBarFlag = []

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
                addIncludedItems: function(items){
                    items.forEach(function(item){
                        if(_includeItems.indexOf(item) == -1){
                            _includeItems.push(item)
                        }
                    })
                },
                dropFromEncluded: function(items){
                    _.remove(_includeItems, function(n){
                        return items.indexOf(n) > -1
                    })
                },
                toggleItem: function(name, disabled){


                    // check if item was selected
                    if(!disabled){
                        if(_includeItems.indexOf(name) > -1){
                            // is visible and was listed as included
                            _.remove(_includeItems, function(n){ return n == name })
                            _sideBarFlag = [false, null]
                        } else {
                            // is visible but was not listed as included
                            if(_includeItems.length > 0){
                                // looks like we are already filtering
                                // therefore detecting as implicit deselect
                                // of currently active item
                                _sideBarFlag = [false, name]
                            } else {
                                // we are not filtering, lets start with this item
                                _includeItems.push(name)
                                _sideBarFlag = [true, null]
                             }
                        }
                    } else {
                        // was disabled and now to be included
                        _includeItems.push(name)
                        _sideBarFlag = [true, name]
                    }

                    /*if(_includeItems.indexOf(name) > -1){
                        // remove item if already listed as included
                         _.remove(_includeItems, function(n){ return n == name })
                         _sideBarFlag = [true, name]
                    } else {
                        _includeItems.push(name)
                        _sideBarFlag = [false, !_sideBarFlag[1]]
                    }*/

                    /*
                    if(_includeItems.indexOf(name) > -1){
                        console.log("Remove from included")
                        // remove item if already listed in includedItems
                        _.remove(_includeItems, function(n){ return n == name })

                    } else if ((_excludedItems.indexOf(name) == -1) && _includeItems.length){
                        // add to excluded if item was neither included or included
                        // which means that item was previously left visible due to
                        // current filtering
                        console.log("add to excluded")
                        _excludedItems.push(name)
                    } else {
                        // item was in excluded items and not already in included
                        // which means it should be added to included filter
                        console.log("add to included")
                        _includeItems.push(name)
                    }*/
                },
                getIncludedItems: function(){
                    //console.log(_includeItems, _excludedItems)
                    return _includeItems
                },
                getExcludedItems: function(){
                    return _excludedItems
                },
                getSidebarFlag: function(){
                    return _sideBarFlag
                }

            }
        }
}])


