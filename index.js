var _ = require('lodash');
var express = require('express');
var client = require('./cbclient.js')
var config = require('./config.js')

var app = express();
app.use(express.static('app'));


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
  		data.sort(function(b1, b2){
  			if(b1.build > b2.build){
  				return 1
  			}
  			if(b1.build < b2.build){
  				return -1
  			}
  			return 0
  		})
	 	res.send(data);
  	}).catch(function(err){
  		// err
		console.log(err)
		res.send(builds)
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


var server = app.listen(config.httpPort, config.httpListen, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Greenboard listening at http://%s:%s', host, port);
});
