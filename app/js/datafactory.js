angular.module('svc.data', [])
  .value("DEFAULT_FILTER_BY", 500)
  .service('Data', ['$location', 'DEFAULT_FILTER_BY', function ($location, DEFAULT_FILTER_BY){

    _versions = []
    _target = "server"
    _version = null
    _versions = []
    _build = null
    _builds = []
    _targetVersions = {}
    _buildJobs = []
    _buildJobsActive = []
    _sideBarItems = []
    _filterBy = DEFAULT_FILTER_BY
    _initUrlParams = null
    _buildInfo = {}

   function updateLocationUrl(type, key, disabled){
        var typeArgs = $location.search()[type]
        if(!disabled){
            if(!typeArgs || typeArgs.length==0){
                typeArgs = key
            } else if(typeArgs.indexOf(key) == -1) {
                typeArgs+=","+key
            }
            if(!_.any(_.pluck(_sideBarItems[type], "disabled"))){
                // all items are selected now
                typeArgs = null
            }
            $location.search(type, typeArgs);
        } else {
            if(typeArgs){
                var regex = new RegExp(",?" + key)
                var typeArgs = typeArgs.replace(regex, "")
                                    .replace(/^,/,"")
                if(typeArgs == ""){
                    typeArgs = null
                }
                $location.search(type, typeArgs)
            }
        }
    }

    function updateSidebarItemState(type, key, disabled){
        // updates disabled flag connected to sidebar item
        // for filtering
       _sideBarItems[type] = _sideBarItems[type].map(function(item){
            if(item["key"] == key){
                item.disabled = disabled
            }
            return item
       })

       updateLocationUrl(type, key, disabled)
    }


    function disableItem(key, type){

        var jobtype = type == "platforms" ? "os" : "component"

        // diabling item: remove from active list of build jobs
        _buildJobsActive = _.reject(_buildJobsActive, function(job){
            return job[jobtype] == key
        })
        updateSidebarItemState(type, key, true)

    }

    function enableItem(key, type){

        var jobtype = type == "platforms" ? "os" : "component"

        // enabling item so include in active list of build jobs
        var includeJobs = _.filter(_buildJobs, function(job){

            // detect if job matches included key
            if(job[jobtype] == key){

                // get alternate of current type..
                // ie... so if we are adding back an os key
                // then get the component listed for this job
                var altTypes = jobtype == "os" ? ["features", "component"] : ["platforms", "os"]
                var sideBarItem = _.find(_sideBarItems[altTypes[0]],"key", job[altTypes[1]])

                // only include this job if it's alternate type isn't disabled 
                // ie.. do not add back goxdcr if os is centos and centos is disabled
                if (!sideBarItem.disabled){
                    return true
                }
            }
        })
        _buildJobsActive = _buildJobsActive.concat(includeJobs)

        // update sidebar state
        updateSidebarItemState(type, key, false)
    }


    function getVersionBuildByFilter(){
        // return version builds according to filter
        var builds = _builds.filter(function(b){ return (b.Passed + b.Failed) > _filterBy})
        if((builds.length == 0) && (_filterBy != 0)){
            builds = _builds
            _filterBy = 0
        }
        return builds
    }

    function buildNameWithVersion(){
        var build = _build
        if (build == "latest"){
            if (_builds.length > 0){
                build = _builds[_builds.length-1]
            }
        }
        // prepend with version if necessary
        if (build && (build.indexOf("-")==-1)){
            build = _version+"-"+build
        }
        return build
    }

    return {
        setTarget: function(target){
            _target = target
        },
        setTargetVersions: function(versions){
            // save versions belonging to this target
            if(_target){
                _targetVersions[_target] = versions
            }
            _versions = versions
        },
        setSelectedVersion: function(version){
            _version = version
        },
        setBuild: function(build){
            if(build.indexOf("-") == -1 && _version){
                build = _version+"-"+build
            }
            _build = build
        },
        setBuildInfo: function(info){
            _buildInfo = info
        },
        getBuildInfo: function(){
            return _buildInfo
        },
        setVersionBuilds: function(builds){
            builds.sort(function(a, b){
                if(a.build < b.build){ return -1 }
                if(a.build > b.build){ return 1 }
                return 0
              })
            _builds = builds
        },
        setBuildJobs: function(jobs){
            _buildJobs = jobs
            _buildJobsActive = jobs
        },
        getBuildJobs: function(){
            // todo get from cache too
            return _buildJobs
        },
        getActiveJobs: function(){
            return _buildJobsActive
        },
        getCurrentTarget: function(){
            return _target
        },
        getTargetVersions: function(target){
            // if requesting specific target lookup in cache
            var versions = _versions
            if(target){
                versions = _targetVersions[target]
            }
            return versions
        },
        getSelectedVersion: function(){
            return _version
        },
        getBuild: function(){
            return buildNameWithVersion()
        },
        getVersionBuilds: getVersionBuildByFilter,
        toggleItem: function(key, type, disabled){

            // check if item is being disabled
            if(disabled){

                // if this is first item to be disabled within os/component
                // then inverse toggling is performed
                var isAnyOfThisTypeDisabled = _.any(_.pluck(_sideBarItems[type], "disabled"))
                if(!isAnyOfThisTypeDisabled){

                    // very well then, inverse toggling it is
                    // disable every item but this one
                    var siblingItems = _.pluck(_sideBarItems[type], "key")
                    siblingItems.forEach(function(k){
                        if(k!=key){
                            disableItem(k, type)
                        }
                    })

                    // re-enable self
                    updateSidebarItemState(type, key, false)
                } else {
                    disableItem(key, type)
                }

            } else {

                // enabling item for visibility
                enableItem(key, type)
            }
        },
        setSideBarItems: function(items){
            _sideBarItems = items
            _sideBarItems['buildVersion'] = buildNameWithVersion()

            // default behavior is to initialize sideBarItems
            // with items param.  
            // UNLESS: initial url params require some items be disabled on load
            // NOTE: params only apply across same target
            if(_initUrlParams && (_initUrlParams.target == _target)){

                // disable everything corresponding to filtered type
                _.mapKeys(items, function(values, type){
                    if(type in _initUrlParams){

                        // type matched what we want to filter
                        values.forEach(function(v){
                            disableItem(v.key, type)
                        })
                    }
                })

                // only enable urlParams
                _.mapKeys(_initUrlParams, function(values, type){

                    if(["platforms", "features"].indexOf(type) != -1){
                        var keys = values.split(",")
                        keys.forEach(function(k){
                            enableItem(k, type)
                        })
                    }
                })
            }

            // drop init params
            _initUrlParams = null
   
        },
        getSideBarItems: function(){
            return _sideBarItems
        },
        getItemStats: function(key, type){
            // calculates pass fail stats for key across all
            // enabled build jobs

            // filter out just jobs with this key
            var jobtype = type == "platforms" ? "os" : "component"
            var subset = _buildJobsActive
            if (type != "build"){
                subset = _.filter(_buildJobsActive, function(job){
                    return job[jobtype] == key
                    })
            }

            // calculate absolute stats
            var absTotal = _.sum(_.pluck(subset, "totalCount"))
            var absFail = _.sum(_.pluck(subset, "failCount"))
            var absPending = _.sum(_.pluck(subset, "pending"))
            var absStats = {
                passed: absTotal-absFail,
                failed: absFail,
                pending: absPending
            }

            // calculate percentage based stats
            var passedPerc = getPercOfVal(absStats, absStats.passed)
            var percStats = {
                run: getItemPercStr(absStats),
                passed: wrapPercStr(passedPerc),
                failed: getPercOfValStr(absStats, absStats.failed),
                pending: getPercOfValStr(absStats, absStats.pending),
                passedRaw: passedPerc
            }

            return {
                absStats: absStats,
                percStats: percStats
            }
            
        },
        toggleAllSidebarItems: function(type, isDisable){

            // set all sidebar items to disabled value
            _sideBarItems[type].forEach(function(item){
                // disable if not already disabled
                if(isDisable && !item.disabled){
                    disableItem(item.key, type)
                } else if (item.disabled) {
                    enableItem(item.key, type)
                }
            })
        },
        getBuildFilter: function(){
            return _filterBy
        },
        setBuildFilter: function(filterBy){
            if(filterBy===undefined){
                filterBy = DEFAULT_FILTER_BY
            }
            _filterBy = filterBy
        },
        getLatestVersionBuild: function(){
            var builds = getVersionBuildByFilter()
            if(builds.length > 0){
                return builds[builds.length-1].build
            }
            return _build
        },
        setUrlParams: function(params){

            if(_initUrlParams === null){
                params["target"] = _target
                _initUrlParams = params
            }
        }
    }

}])



// data helper methods
function getPercOfVal(stats, val){
  if (!stats){
    return 0;
  }

  var denom = stats.passed + stats.failed;
  if(denom == 0){ return 0; }
  return Math.floor(100*((val/denom).toFixed(2)));
}

function getPercOfValStr(stats, val){
  return wrapPercStr(getPercOfVal(stats, val))
}

function getItemPerc(stats){
  if (!stats){
    return 0;
  }

  var total = stats.passed + stats.failed;
  var denom = total + stats.pending;
  if(denom == 0){ return 0; }

  return Math.floor(100*((total/denom).toFixed(2)));
}

function getItemPercStr(stats){
    if (getItemPerc(stats) >= 0){
        return wrapPercStr(getItemPerc(stats))
    }
}

function wrapPercStr(val){
    return val+"%"
}

