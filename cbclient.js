var config = require('./config.js')
	, couchbase = require('couchbase')
	, Promise = require('promise');

// no. of stale responses until we force refresh
var MAX_STALE_RESPONSES = 10;


module.exports = function(){

  var cluster = new couchbase.Cluster(config.Cluster);
  var _stale_cnt = 0;
  var buildJobs = {}
  config.Buckets.forEach(function(b){
  	buildJobs[b] = {}
  })

  function _query(bucket, queryStr){
	  console.log(queryStr)
	  bucket = bucket || config.DefaultBucket
	  var db = cluster.openBucket(config.DefaultBucket)
	  var q = couchbase.N1qlQuery.fromString(queryStr)
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

  var API =  {  

    openBucket: function(bucket){
      bucket = bucket || config.DefaultBucket
	  return cluster.openBucket(config.DefaultBucket)
    },
    queryVersions: function(bucket){
        var Q = "SELECT DISTINCT SPLIT(`build`,'-')[0] AS version"+
                " FROM "+bucket+" ORDER BY version"
        return _query(bucket, Q)
    },
    queryBuilds: function(bucket, version){
        var Q = "SELECT `build`,SUM(failCount) AS Failed,SUM(totalCount)-SUM(failCount) AS Passed"+
                " FROM "+bucket+" WHERE `build` like '"+version+"%' GROUP BY `build`";
        return _query(bucket, Q)
    },
    jobsForBuild: function(bucket, build){
  	  var ver = build.split('-')[0]
	  var Q =  "SELECT * FROM "+bucket+" AS executed "+
	           " WHERE `build`='"+build+"'"+
	           " UNION"+
	           " SELECT * FROM "+bucket+" AS pending"+
	           " WHERE `build` LIKE '"+ver+"%' "+
	       	     " EXCEPT "+
               " SELECT * FROM "+bucket+" WHERE `build`='"+build+"'";

      // start the query
      var qp = _query(bucket, Q)

      if((_stale_cnt < MAX_STALE_RESPONSES) && buildJobs[build]){
      	_stale_cnt++;
      	// return cached instance
      	return Promise.resolve(buildJobs[build])
      }

      // return live results
      return qp.then(function(data){
    			// cache
    			buildJobs[build] = data
    			return data
    		})
    },
    queryBucket: _query

  }

  return API

}()



// number of jobs per os
// SELECT os,component, COUNT(*) as count from server GROUP BY os;