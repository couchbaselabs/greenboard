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

app.get('/sidebar/:build/:bucket', function(req, res){


    var bucket = req.params.bucket
    var build = req.params.build
    client.sidebarStatsForBuild(bucket, build)
        .then(function(stats){
            res.send(stats)
        }).catch(function(err){
            console.log(err)
            res.send({err: err})
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

  client.claimJobs(bucket, name, build_id, claim)
    .then(function(jobs){
      res.send('POST request to the homepage');
    }).catch(function(err){
      res.send({err: err})
    })

});


var server = app.listen(config.httpPort, config.httpListen, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Greenboard listening at http://%s:%s', host, port);
});
