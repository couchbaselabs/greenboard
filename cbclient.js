var config = require('./config.js')
	, couchbase = require('couchbase')
	, Promise = require('promise');
var _ = require('lodash');


module.exports = function(){

  var cluster = new couchbase.Cluster(config.Cluster);
  var dbs = {}
  var jobQueryCache = {}
  var jobResponseCache = {}
  var buildsResponseCache = {}
  var versionsResponseCache = {}

  // init dbs
  config.Buckets.map(function(b){
      return dbs[b] = cluster.openBucket(config.DefaultBucket) })

  function strToQuery(queryStr, adhoc){
    console.log("QUERY:",queryStr)
    adhoc = adhoc ? true: false
    return couchbase.N1qlQuery.fromString(queryStr).adhoc(adhoc)
  }

  function _query(bucket, q){
	  var promise = new Promise(function(resolve, reject){
		  dbs[bucket].query(q, function(err, components) {
		  		if(!err){
			  		resolve(components)
			  	} else {
			  		reject(err)
			  	}
		  })
	  })
	  return promise
  }

  var API =  {

    queryVersions: function(bucket){
        var Q = "SELECT DISTINCT SPLIT(`build`,'-')[0] AS version"+
                " FROM "+bucket+" ORDER BY version"
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
        var Q = "SELECT `build`,SUM(failCount) AS Failed,SUM(totalCount)-SUM(failCount) AS Passed"+
                " FROM "+bucket+" WHERE `build` like '"+version+"%' GROUP BY `build`";
        var qp = _query(bucket, strToQuery(Q, true))
          .then(function(data){
            buildsResponseCache[version] = data
            return data
          })
        if(version in buildsResponseCache){
          return Promise.resolve(buildsResponseCache[version])
        } else {
          return qp
        }
    },
    getBuildInfo: function(bucket, build, fun){
      dbs[bucket].get(build, fun)
    },
    jobsForBuild: function(bucket, build){
      var ver = build.split('-')[0]
      var qStr = "SELECT * FROM "+bucket+" WHERE `build` LIKE '"+ver+"%'"
      var queryObj = strToQuery(qStr)
      if(ver in jobQueryCache){
        queryObj = jobQueryCache[ver]
      }

      jobQueryCache[ver] = queryObj

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
      var qp = _query(bucket, queryObj).then(function(data){
        // cache response
        jobResponseCache[ver] = _.cloneDeep(data)
        return processJobs(data)
      })

      if(ver in jobResponseCache){
        var data = jobResponseCache[ver]
        var response = processJobs(data)
        return Promise.resolve(response)
      } else {
        return qp
      }

    }

  }

  return API

}()



// number of jobs per os
// SELECT os,component, COUNT(*) as count from server GROUP BY os;
