var realFs = require('fs')
var gracefulFs = require('graceful-fs')
gracefulFs.gracefulify(realFs)

var _ = require('lodash');
var express = require('express');
var client = require('./cbclient.js')
var config = require('./config.js')
var bodyParser = require('body-parser')

var app = express();
app.use(express.static('app'));
app.use(bodyParser.json());

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

app.get('/builds/:bucket/:version/:testsFilter/:buildsFilter', function(req, res){

  var bucket = req.params.bucket
  var version = req.params.version
  var testsFilter = req.params.testsFilter
  var buildsFilter = req.params.buildsFilter
  var builds = []
  client.queryBuilds(bucket, version, testsFilter, buildsFilter)
  	.then(function(data){
  		data.sort(function(b1, b2){
  			if(b1.build > b2.build){
  				return 1
  			}
  			if(b1.build < b2.build){
  				return -1
  			}
  			return 0
		})
		res.send(data)
  	}).catch(function(err){
  		// err
		console.log(err)
		res.send(builds)
	})
})


app.get('/timeline/:version/:bucket/:testsFilter/:buildsFilter', function(req, res){
	
	var dataMap = []
	var version = req.params.version
    var bucket = req.params.bucket
	var testsFilter = req.params.testsFilter
	var buildsFilter = req.params.buildsFilter
	var Q = "select `build` AS Version,"+
					"SUM(totalCount) AS AbsPassed,"+
					"SUM(failCount) AS AbsFailed,"+
					"((SUM(totalCount)-SUM(failCount))/SUM(totalCount))*100 AS RelPassed "+
						"FROM "+bucket+" WHERE `build` LIKE '"+version+"%' GROUP BY `build` " +
					"HAVING SUM(totalCount) >= "+testsFilter+" LIMIT "+ buildsFilter
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
		.then(function(breakdown){

			res.send(breakdown)
		}).catch(function(err){
			console.log(err)
		})

})

app.get('/info/:build/:bucket', function(req, res){

	var build = req.params.build
	var bucket = req.params.bucket

	client.getBuildInfo(bucket, build, function(err, info){
		if(err){
			console.log(err)
			res.send({err: err})
		}  else {
			res.send(info)
		}
	})
})

app.post('/claim/:bucket/:name/:build_id', function (req, res) {
  var bucket = req.params.bucket
  var name = req.params.name
  var build_id = req.params.build_id
  var claim = req.body.claim
  var os = req.body.os
  var comp = req.body.comp
  var version = req.body.build
  client.claimJobs(bucket, name, build_id, claim,os,comp,version)
    .then(function(jobs){
      res.send('POST request to the homepage');
    }).catch(function(err){
      res.send({err: err})
    })

});

app.get('/getBuildSummary/:buildId', function (req, res) {
	var buildId = req.params.buildId;
	client.getBuildSummary(buildId).then(function (buildDetails) {
		res.send(buildDetails)
    }).catch(function(err){
    	console.log(err)
	})
});


var server = app.listen(config.httpPort, config.httpListen, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Greenboard listening at http://%s:%s', host, port);
});
