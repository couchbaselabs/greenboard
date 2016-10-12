var config = require('./config.js')
	, couchbase = require('couchbase')
	, Promise = require('promise');
var _ = require('lodash');


module.exports = function(){

  var cluster = new couchbase.Cluster(config.Cluster);
  var db = cluster.openBucket(config.DefaultBucket)
  var versionsResponseCache = {}
  var buildsResponseCache = {}
  var jobsResponseCache = {}
  var pendingVerResponseCache = {} 

  function strToQuery(queryStr, adhoc){
    console.log(new Date(), "QUERY:",queryStr)
    adhoc = adhoc ? true: false
    return couchbase.N1qlQuery.fromString(queryStr).adhoc(adhoc)
  }

  function _query(bucket, q){
	  var promise = new Promise(function(resolve, reject){
		  db.query(q, function(err, components) {
		  		if(!err){
			  		resolve(components)
			  	} else {
			  		reject(err)
			  	}
		  })
	  })
	  return promise
  }

  function doUpsert(bucket, key, doc){
    var db = cluster.openBucket(bucket)
	  var promise = new Promise(function(resolve, reject){
      db.upsert(key, doc, function(err, result){
        if(err){ reject({err: err}) }
        else {
          resolve(result)
        }
      })
    })
    return promise
  }

  function queryBuild(bucket, build){
        var ver = build.split("-")[0]

        // get total and fail count for every os and component of build along
        // with the totalCount from All builds in version to calculate pending
        var Q = "SELECT os,component, SUM(totalCount) AS total,SUM(failCount) AS fail"+
                  " FROM server USE INDEX (sidebar_stats)"+
                  " WHERE `build` == \""+build+"\""+
                  " GROUP BY os, component"+
                " UNION"+
                " SELECT os,component,SUM(totalCount) AS comp_ver_total"+
                  " FROM server USE INDEX (sidebar_stats)"+
                  " WHERE `build` like \""+ver+"%\""+
                  " GROUP BY os, component";

        var qp = _query(bucket, strToQuery(Q))
          .then(function(data){
            return data
          })

        return qp
    }
    function _jobsForBuild(bucket, build){
          var Q = "SELECT * FROM "+bucket+" WHERE `build` == \""+build+"\""


          function updateJobsCache(){
            return _query(bucket, strToQuery(Q)).then(function(data){
                // cache and return response
                var rc  = _.chain(data)
                                               .cloneDeep()
                                               .map(bucket)
                                               .value()
                jobsResponseCache[build] = rc
                return  rc 
            })
          }
           
          if(build in jobsResponseCache){
            var data = jobsResponseCache[build]
            updateJobsCache()
            return Promise.resolve(data)
          } else {
            return updateJobsCache()

          }

     }

  var API =  {

    queryVersions: function(bucket){
        var Q = "SELECT DISTINCT SPLIT(`build`,'-')[0] AS version"+
                " FROM "+bucket+" WHERE `build` IS NOT NULL"+
                " ORDER BY version"
        var qp = _query(bucket, strToQuery(Q))
          .then(function(data){
            versionsResponseCache[bucket] = data
            return data
          })

        if(bucket in versionsResponseCache){
          return Promise.resolve(versionsResponseCache[bucket])
        } else {
          return qp
        }
    },
    getBuildInfo: function(bucket, build, fun){
      var db = cluster.openBucket(bucket)
      db.get(build, fun)
    },

    queryBuilds: function(bucket, version){
        var Q = "SELECT `build`,totalCount,failCount FROM "+bucket+
                " WHERE `build` LIKE \""+version+"%\""
    
        function processBuild(data){
            // group all jobs by build and aggregate data for timeline
            var builds = _.chain(data).groupBy('build')
                .map(function(buildSet){
                  var total = _.sum(_.map(buildSet, "totalCount"))
                  var failed = _.sum(_.map(buildSet, "failCount"))
                  var passed = total - failed
                  return {
                    Failed: failed,
                    Passed: passed,
                    build: buildSet[0].build
                  }
                })
            return builds
        }
    
        var qp = _query(bucket, strToQuery(Q))
          .then(function(data){
            buildsResponseCache[version] = _.cloneDeep(data)
            return processBuild(data)
          })
    
        if(version in buildsResponseCache){
          var data = buildsResponseCache[version]
          var response = processBuild(data)
          return Promise.resolve(response)
        } else {
          return qp
        }
    },

    jobsForBuild: _jobsForBuild,
    jobsPendingForBuild: function(bucket, build){

      var ver = build.split('-')[0]
      var allQ = "SELECT * FROM "+bucket+
                " WHERE `build` LIKE \""+ver+"%\"";
      var Q = "SELECT * FROM "+bucket+
                " WHERE `build` LIKE \""+ver+"%\""+
                " EXCEPT"+
                " SELECT * FROM "+bucket+" WHERE `build` == \""+build+"\"";


      // 1. check if pending for version and job already exists
      //    - yes? get jobs for build and compute pending
      //    - no? continue
      // 2. do special query to quickly return pending and
      //    save all jobs for use in step 2

      function updatePendingCache(){
        // get all jobs and cache for faster results
        _query(bucket, strToQuery(allQ)).then(function(allData){
            pendingVerResponseCache[ver] = _.cloneDeep(allData)
        })
      }

      if((ver in pendingVerResponseCache) && (build in jobsResponseCache)){
        var allJobs = pendingVerResponseCache[ver]
        var buildJobs = jobsResponseCache[build]

        var jobNames = _.map(buildJobs, function(item){ return item.name })
        var pending = _.chain(allJobs)
                .filter(function(j){
                  // job is pending if name is not in known job names
                  return _.indexOf(jobNames, j[bucket].name) == -1
                })
                .map(bucket)
                .value()
        updatePendingCache()
        return Promise.resolve(pending)

      } else {
        return _query(bucket, strToQuery(Q)).then(function(data){
            updatePendingCache()

            // just return n1ql response 
            return _.map(data, function(j){return j[bucket]})
        })
      }

    },
   claimJobs: function(bucket, name, build_id, claim){

     // claim this build an all newer builds
      var Q = "SELECT meta("+bucket+").id,* FROM "+bucket+" WHERE name=\""+name+"\" AND build_id >= "+build_id
      var _ps = []
	    var promise = new Promise(function(resolve, reject){
        _query(bucket, strToQuery(Q)).catch(reject)
          .then(function(jobs){
            jobs.forEach(function(d){
               var key = d.id
               var doc = d.server
               doc.customClaim = claim  // save new claim tag
               var p = doUpsert(bucket, key, doc)
               _ps.push(p)
            })
            Promise.all(_ps) // resolve upsert promises
              .then(resolve).catch(reject)
        })
      })
	    return promise
   },
   sidebarStatsForBuild: function(bucket, build){

      var ver = build.split('-')[0]
	    var promise = new Promise(function(resolve, reject){
          // get active jobs for this build
          queryBuild(bucket, build)
            .then(function(rc){
                var stats = {
                  OS: {},
                  COMPONENT: {},
                }
                _.each(rc, function(item){
                  var os = item.os
                  var comp = item.component
                  var total = item.total || 0
                  var fail = item.fail || 0
                  var pending = item.comp_ver_total || (-1*total)
                  var passed = total - fail
                  // create os and component level breakdowns
                  if (os in stats.OS) { // exists
                      if (comp in stats.OS[os]) { 
                        stats.OS[os][comp].passed += passed
                        stats.OS[os][comp].failed += fail
                        stats.OS[os][comp].pending += pending 
                      } else { // new comp for os
                        stats.OS[os][comp] = {
                            passed: passed,
                            failed: fail,
                            pending: pending,
                        }
                      }
                  } else { // new os stat
                      stats.OS[os] = {}
                      stats.OS[os][comp] = {
                          passed: passed,
                          failed: fail,
                          pending: pending,
                      }
                  }
                  if (comp in stats.COMPONENT) { // exists
                      if (os in stats.COMPONENT[comp]) {
                        stats.COMPONENT[comp][os].passed += passed
                        stats.COMPONENT[comp][os].failed += fail
                        stats.COMPONENT[comp][os].pending += pending 
                      } else {
                        stats.COMPONENT[comp][os] = {
                            passed: passed,
                            failed: fail,
                            pending: pending,
                        }
                      }
                  } else { // new component stat
                      stats.COMPONENT[comp] = {}
                      stats.COMPONENT[comp][os] = {
                          passed: passed,
                          failed: fail,
                          pending: pending,
                      }
                  }
                })
                resolve(stats)
            })
        })

        return promise
   },

  }

  return API

}()



// number of jobs per os
// SELECT os,component, COUNT(*) as count from server GROUP BY os;
