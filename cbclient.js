var config = require('./config.js')
	, couchbase = require('couchbase')
	, Promise = require('promise');
var _ = require('lodash');


module.exports = function(){

  var cluster = new couchbase.Cluster(config.Cluster);
  cluster.authenticate(config.RBACUser, config.RBACKPassword);
  var db = _db(config.DefaultBucket)
  var buildsResponseCache = {}
  var versionsResponseCache = {}

  function _db(bucket) {
    if (config.AuthPassword != ""){
      //cluster.authenticate(bucket, config.AuthPassword);
      cluster.authenticate(config.RBACUser, config.AuthPassword);
    }
    var db = cluster.openBucket(bucket)
    //db.operationTimeout = 120 * 1000
    return db
  }

  function strToQuery(queryStr, adhoc){
    console.log(new Date(), "QUERY:",queryStr)
    adhoc = adhoc ? true: false
    return couchbase.N1qlQuery.fromString(queryStr).adhoc(adhoc)
  }

  function _query(bucket, q){
    var db = _db(bucket)
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
    var db = _db(bucket)
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
  var API =  {

    queryVersions: function(bucket){
        var Q = "SELECT DISTINCT SPLIT(`build`,'-')[0] AS version"+
                " FROM "+bucket+" where SPLIT(`build`,'-')[0] is not missing ORDER BY version"
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
    queryBuilds: function(bucket, version){
        var Q = "SELECT * FROM "+bucket+" WHERE `build` LIKE '"+version+"%'"

        function processBuild(data){
            // group all jobs by build and aggregate data for timeline
            var builds = _.chain(data).pluck(bucket).groupBy('build')
                .map(function(buildSet){
                  var total = _.sum(_.pluck(buildSet, "totalCount"))
                  var failed = _.sum(_.pluck(buildSet, "failCount"))
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
    getBuildInfo: function(bucket, build, fun){
      var db = _db(bucket)
      db.get(build, fun)
    },
    jobsForBuild: function(bucket, build){
      var ver = build //build.split('-')[0]
      var Q = "SELECT * FROM "+bucket+" WHERE `build` LIKE '"+ver+"%'"

      function processJobs(queryData){

        // jobs for this build
        var data = _.pluck(queryData, bucket)
        var jobs = _.filter(data, 'build', build)
        var jobNames = _.pluck(jobs, 'name')

        var pending = _.filter(data, function(j){
          // job is pending if name is not in known job names
          return _.indexOf(jobNames, j.name) == -1
        })

        // convert total to pending for non-executed jobs
        pending = _.map(_.uniq(pending, 'name'), function(job){
          job["pending"] = job.totalCount || job.pending
          job["totalCount"] = 0
          job["failCount"] = 0
          job["result"] = "PENDING"
          return job
        })
        var breakdown = jobs.concat(pending)
        return breakdown
      }

      // run query
      var qp = _query(bucket, strToQuery(Q)).then(function(data){
        // cache response
        buildsResponseCache[ver] = _.cloneDeep(data)
        return processJobs(data)
      })

      if(ver in buildsResponseCache){
        var data = buildsResponseCache[ver]
        var response = processJobs(data)
        return Promise.resolve(response)
      } else {
        return qp
      }

    },
   claimJobs: function(bucket, name, build_id, claim){

     // claim this build an all newer builds
      var Q = "SELECT meta("+bucket+").id,* FROM "+bucket+" WHERE name='"+name+"' AND build_id >= "+build_id
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

  }

  return API

}()



// number of jobs per os
// SELECT os,component, COUNT(*) as count from server GROUP BY os;
