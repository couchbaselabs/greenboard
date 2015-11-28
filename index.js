var _ = require('lodash');
var express = require('express');
var client = require('./cbclient.js')

var app = express();
app.use(express.static('app'));


app.get('/categories/:bucket?', function (req, res) {

  var bucket = req.params.bucket
  var dataMap = {"component": [], "os": []}

  client.queryBucket(bucket, "SELECT DISTINCT os FROM server UNION SELECT DISTINCT component FROM server")
  	.then(function(data){
  		data.forEach(function(d){
  			type = d['component'] ? 'component': 'os'
  			dataMap[type].push(d[type])
  		})
	 	res.send(dataMap);
  	}).catch(function(err){
  		// err
		console.log(err)
		res.send(dataMap)
  	})
});

app.get('/versions/:bucket?', function(req, res){

  var bucket = req.params.bucket
  var versions = []
  client.queryVersions(bucket)
  	.then(function(data){
  		versions = data.map(function(d){
  			return d['version']
  		})
	 	res.send(versions);
  	}).catch(function(err){
  		// err
		console.log(err)
		res.send(versions)
  	})
})

app.get('/builds/:bucket/:version', function(req, res){

  var bucket = req.params.bucket
  var version = req.params.version
  var builds = []
  client.queryBuilds(bucket, version)
  	.then(function(data){
	 	res.send(data);
  	}).catch(function(err){
  		// err
		console.log(err)
		res.send(builds)
  	})
})


app.get('/timeline/:version/:bucket?', function(req, res){
	
	var dataMap = []
	var version = req.params.version
    var bucket = req.params.bucket
	var Q = "select `build` AS Version,"+
					"SUM(totalCount) AS AbsPassed,"+
					"SUM(failCount) AS AbsFailed,"+
					"((SUM(totalCount)-SUM(failCount))/SUM(totalCount))*100 AS RelPassed "+
						"FROM server WHERE `build` LIKE '"+version+"%' GROUP BY `build` ;"
	client.queryBucket(bucket, Q)
	  	.then(function(data){
	  		data.forEach(function(d){
	  			d['RelFailed']=100-d['AbsFailed']
	  			dataMap.push(d)
	  		})
	  		// console.log(dataMap)
		 	res.send(dataMap);
	  	}).catch(function(err){
	  		// err
			console.log(err)
			res.send(dataMap)
	  	})

})

app.get('/jobs/:build/:bucket?', function(req, res){

	var bucket = req.params.bucket
    var build = req.params.build

	client.jobsForBuild(bucket, build)
		.then(function(data){

			var executed = _.compact(_.pluck(data, "executed"))
			var pending = _.compact(_.pluck(data, "pending"))

			// convert total to pending for non-executed jobs
			pending = _.map(_.uniq(pending, 'url'), function(job){
				job["pending"] = job.totalCount
				job["totalCount"] = 0
				job["failCount"] = 0
				return job
			})
			var breakdown = executed.concat(pending)
			res.send(breakdown)
		}).catch(function(err){
			console.log(err)
		})

})


var server = app.listen(8200, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Greenboard listening at http://%s:%s', host, port);
});
