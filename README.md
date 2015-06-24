# Greenboard 

QE Dashboard tool for displaying jenkins test results.  Currently deployed at [greenboard.hq](http://greenboard.couchbase.com)


## Building

To build and deploy your own instance of greenboard:
`git clone https://github.com/tahmmee/greenboard.git`

Have the following dependencies ready before getting started:
- golang
- nodejs
- local instance of couchbase server with 3 buckets (mobile, sdk, server)

Build Backend service.  From top of repo run

`go build`

`go install`

Build UI:

`cd app`

`npm install`

`bower install`

`./node_modules/.bin/grunt`

Open config.json and verify CouchbaseAddress and ListenAddress for greenboard service are correct.

`greenboard`

Greenboard service should be running on host and port specified from ListenAddress.  Default [localhost:8181](http://localhost:8181)


## Collecting Jobs

Now that greenboard is running you will need to collect jobs from jenkins.  This is currently done via jinja.

`git clone https://github.com/tahmmee/jinja.git`

`python jinja.py`

This will run the collector once.  In production you may want to wrap it in some continuous loop to get constant updates.


## Troubleshooting

"My Jobs aren't showing up"
- Make sure you ran your job with expected build number
- Make sure your job produced test results.  Append the following uri to your job and check for totalCount keyword - ie. 'http://qa.sc.couchbase.com/job/cen006-p0-sanit-vset01-00/1624/api/json?pretty=true'
- Check that the collector is running
- Look in constants.py of the collector repro (jinja) and make sure the job you are looking for matches within 'SERVER_PLATFORMS' and 'SERVER_FEATURES', both matches are necessary for job to be picked up

"My Job should be removed"
- Check that your job was first deleted from jenkins. Greenboard only purges deleted jobs
- Make sure that the purger is running
- Wait some time, purger have 5 minute delay
- Debug the purger in scripts/purger.go, check to see what jobs it's picking up and why yours may be missing


"Greenboard is down"
- Make sure greenboard service itself is running
- Make sure that couchbase backend is running
- Check config.json that ListenAddress is correct for greenboard service.  Also make sure CouchbaseAddress is correct
- Check for system firewalls that may be blocking greenboard http port

## Caveat

Greenboard must run against a single instance of couchbase - preferably localhost.  This is because all data is loaded into vbucket 0 due to a legacy workaround to avoid dependencies on sdks ie golang/nodejs/python.


