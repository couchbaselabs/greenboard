var express = require('express');
var client = require('./cbclient.js')

var app = express();
app.use(express.static('app'));


//0 http://localhost:8100/categories?bucket=server
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


//2 http://localhost:8100/timeline?bucket=server&end_key=4.5.0&start_key=4.1.0
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

//3 http://localhost:8200/breakdown?bucket=server&build=4.1.0-4933
app.get('/breakdown/:build/:bucket?', function(req, res){

	var bucket = req.params.bucket
    var build = req.params.build

	client.jobsForBuild(bucket, build)
		.then(function(data){
			var breakdown = []
			data.forEach(function(doc){
				var type = doc['executed']? 'executed': 'pending'
				var pendingTotal = type=='pending'? doc[type].totalCount: 0
				var job = doc[type]

				breakdown.push({
				  	Version: job.build,
				  	Passed: job.totalCount - job.failCount,
				  	Failed: job.failCount,
				  	Pending: pendingTotal,
				  	Category: job.component,
				  	Platform: job.os,
				  	Priority: job.priority
				})
			})
			res.send(breakdown)
		}).catch(function(err){
			console.log(err)
		})

})

//4 http://localhost:8200/jobs?bucket=server&build=4.1.0-4933
app.get('/jobs/:build/:bucket?', function(req, res){
	var bucket = req.params.bucket
    var build = req.params.build
	client.jobsForBuild(bucket, build)
		.then(function(data){
			var jobs = []
			data.forEach(function(doc){
				if(doc['executed']){
					var job = doc['executed']
					jobs.push({
					  	Version: job.build,
					  	Total: job.totalCount,
					  	Name: job.name,
					  	Result: job.result,
					  	Url: job.url,
					  	Claim: job.claim,
					  	Bid: job.build_id,
					  	Duration: job.duration,
					  	Passed: job.totalCount - job.failCount,
					  	Category: job.component,
					  	Platform: job.os,
					  	Priority: job.priority
					})
				}
			})
			res.send(jobs)
		}).catch(function(err){
			console.log(err)
		})

})

//5 http://localhost:8200/jobs_missing?bucket=server&build=4.1.0-4933
app.get('/jobs_missing/:build/:bucket?', function(req, res){
	var bucket = req.params.bucket
    var build = req.params.build
	client.jobsForBuild(bucket, build)
		.then(function(data){
			var jobs = []
			data.forEach(function(doc){
				if(doc['pending']){
					var job = doc['pending']
					jobs.push({
					  	Version: job.build,
					  	Total: job.totalCount,
					  	Name: job.name,
					  	Result: job.result,
					  	Url: job.url,
					  	Claim: job.claim,
					  	Bid: job.build_id,
					  	Duration: job.duration,
					  	Passed: job.totalCount - job.failCount,
					  	Category: job.component,
					  	Platform: job.os,
					  	Priority: job.priority
					})
				}
			})
			res.send(jobs)
		}).catch(function(err){
			console.log(err)
		})
})

var server = app.listen(8200, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
