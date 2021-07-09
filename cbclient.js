var config = require('./config.js')
    , couchbase = require('couchbase')
    , Promise = require('promise');
var _ = require('lodash');

const createJenkins = require('jenkins')

let jenkinsCredentials;
try {
    jenkinsCredentials = require("./jenkinsCredentials.json");
} catch (e) {
    jenkinsCredentials = []
}

const jenkinsConnnections = {}
for (const [givenUrl, { username, password}] of Object.entries(jenkinsCredentials)) {
    const url = new URL(givenUrl);
    url.username = username;
    url.password = password;
    jenkinsConnnections[givenUrl] = createJenkins(({ baseUrl: url.toString(), promisify: true }));
}

function getJenkins(jobUrl) {
    for (const [url, connection] of Object.entries(jenkinsConnnections)) {
        if (jobUrl.startsWith(url)) {
            return connection;
        }
    }
    return null;
}

module.exports = function () {

    var cluster = new couchbase.Cluster(config.Cluster,replicate_to=3);
    cluster.authenticate(config.RBACUser, config.RBACKPassword);
    var db = _db(config.DefaultBucket)
    var buildsResponseCache = {}
    var versionsResponseCache = {}
    var bucketConnections = _bucketConnection()

    function _bucketConnection() {
        var buckets = {}
        var rerun = _db('rerun')
        // var server = _db('server')
        // var sdk = _db('sdk')
        // var mobile = _db('mobile')
        // var builds = _db('builds')
	var greenboard = _db('greenboard')
	var triage_history = _db('triage_history')
        // buckets['server'] = server
        // buckets['sdk'] = sdk
        // buckets['mobile'] = mobile
        // buckets['builds'] = builds
    buckets['greenboard'] = greenboard
    buckets['rerun'] = rerun
    buckets['triage_history'] = triage_history
        return buckets
    }

    function _db(bucket) {
        if (config.AuthPassword != "") {
            //cluster.authenticate(bucket, config.AuthPassword);
	    cluster.authenticate(config.RBACUser, config.AuthPassword);
        }
        var db = cluster.openBucket(bucket)
        db.operationTimeout = 120 * 1000
        return db
    }

    function strToQuery(queryStr) {
        console.log(new Date(), "QUERY:", queryStr)
        return couchbase.N1qlQuery.fromString(queryStr)
    }

    function _query(bucket, q) {
        var db = bucketConnections["greenboard"]
        if (!db.connected) {
            db = _db(bucket);
            bucketConnections[bucket] = db
        }
        var promise = new Promise(function (resolve, reject) {
            db.query(q, function (err, components) {
                if (!err) {
                    resolve(components)
                } else {
                    reject(err)
                }
            })
        })
        return promise
    }

    function _getmulti(bucket, docIds) {
        var db = bucketConnections[bucket]
        if (!db.connected){
            db = _db(bucket);
            bucketConnections[bucket] = db
        }
        return new Promise(function (resolve, reject) {
            db.getMulti(docIds, function (error, result) {
                if (error) {
                    console.log(error)
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        })
    }

    function _upsert(bucket, key, doc, cas){
        var db = bucketConnections["greenboard"];
        if (!db.connected){
            db = _db(bucket);
            bucketConnections[bucket] = db
        }
        var options = {}
        if (cas) {
            options.cas = cas
        }
        return new Promise(function (resolve, reject) {
            db.upsert(key,doc,options, function (error, result) {
                if (error) {
                    console.log(error)
                    reject(error);
                } else {
                    console.log(result)
                    resolve(result);
                }
            })
        });
      }
    
    function _get(bucket, documentId) {
        var db = bucketConnections[bucket];
        if (!db.connected){
            db = _db(bucket);
            bucketConnections[bucket] = db
        }
        return new Promise(function (resolve, reject) {
            db.get(documentId, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            })
        });
    }

    function doUpsert(bucket, key, doc) {
        var db = bucketConnections[bucket]
        if (!db.connected){
            db = _db(bucket);
            bucketConnections[bucket] = db
        }
        var promise = new Promise(function (resolve, reject) {
            db.upsert(key, doc, function (err, result) {
                if (err) {
                    reject({err: err})
                }
                else {
                    resolve(result)
                }
            })
        })
        return promise
    }

    var API = {
        queryJobDetails : function(jobName,build){
            var Q = "SELECT runs FROM `rerun` USE KEYS \"" + build + "\""
            console.log(Q)
            function queryJobDetail() {
                var qp = _query('rerun', strToQuery(Q))
                    .then(function (data) {
                        // versionsResponseCache[bucket] = data
                        console.log(data)
                        return data
                    })
                return qp
            }
            return queryJobDetail()
        },
        queryVersions: function (bucket) {
            var Q = "SELECT DISTINCT SPLIT(`build`,'-')[0] AS version " +
                "FROM `greenboard` WHERE REGEXP_LIKE(`build`, '\\\\d+.\\\\d+.\\\\d+-.*') AND SPLIT(`build`,'-')[0] is not null AND type = '" + bucket + "' ORDER BY version"
            // var Q = "SELECT DISTINCT SPLIT(`build`,'-')[0] AS version"+
            //         " FROM "+bucket+" where SPLIT(`build`,'-')[0] is not null ORDER BY version"
            function queryVersion() {
                var qp = _query('greenboard', strToQuery(Q))
                    .then(function (data) {
                        versionsResponseCache[bucket] = data
                        console.log(data)
                        return data
                    })
                return qp
            }
            
            if (bucket in versionsResponseCache) {
                var data = versionsResponseCache[bucket]
                if (data.length == 0) {
                    return queryVersion()
                }
                queryVersion();
                return Promise.resolve(versionsResponseCache[bucket])
            } else {
                return queryVersion()
            }
        },
        queryBuilds: function (bucket, version, testsFilter, buildsFilter) {
            var Q = "SELECT totalCount, failCount, `build` FROM `greenboard` WHERE `build` LIKE '" + version + "%' " +
                " AND type = '" + bucket + "' AND totalCount >= " + testsFilter + " ORDER BY `build` DESC limit " + buildsFilter
            // var Q = "SELECT SUM(totalCount) AS totalCount, SUM(failCount) AS failCount, `build`  FROM "
            //     +bucket+" WHERE `build` LIKE '"+version+"%' GROUP BY `build` HAVING SUM(totalCount) >= " + testsFilter +
            //     " ORDER BY `build` DESC limit "+buildsFilter

            function processBuild(data) {
                var builds = _.map(data, function (buildSet) {
                    var total = buildSet.totalCount
                    var failed = buildSet.failCount
                    var passed = total - failed
                    return {
                        Failed: failed,
                        Passed: passed,
                        build: buildSet.build
                    }
                })
                return builds
            }

            function queryBuild() {
                var qp = _query(bucket, strToQuery(Q))
                    .then(function (data) {
                        buildsResponseCache[version] = _.cloneDeep(data)
                        return processBuild(data)
                    })
                return qp
            }

            // if (version in buildsResponseCache) {
            //     var data = buildsResponseCache[version]
            //     var response = processBuild(data)
            //     console.log(response)
            //     if (response.length == 0) {
            //         return queryBuild()
            //     }
            //     queryBuild()
            //     return Promise.resolve(response)
            // } else {
                return queryBuild()
            // }
        },
        getBuildInfo: function (bucket, build, fun) {
            var db = bucketConnections["greenboard"]
            if (!db.connected){
                db = _db(bucket);c
                bucketConnections[bucket] = db
            }
            db.get(build, fun)
        },
        jobsForBuild: function (bucket, build) {
            function getJobs() {
                var doc_id = build.concat("_",bucket)
                var existing_builds_id = "existing_builds".concat("_",bucket)
                return _getmulti('greenboard', [doc_id,existing_builds_id]).then(function (result) {
                    console.log(result)
                    var job = result[doc_id].value
                    var allJobs = result[existing_builds_id].value
                    var processedJobs =  processJob(job, allJobs, build)
                    buildsResponseCache[build] = processedJobs
                    return processedJobs
                })
                // var Q1 = "SELECT * FROM `greenboard` USE KEYS ['" + build + "','existing_builds']"
                // return _query('greenboard',strToQuery(Q1)).then(function(result){
                //     var job = result[0]["greenboard"]
                //     var allJobs = result[1]["greenboard"]
                //     var processedJobs =  processJob(job, allJobs, build)
                //     buildsResponseCache[build] = processedJobs
                //     return processedJobs
                // })
            }

	        function processJob(jobs, allJobs, buildId) {
                var type = jobs.type
                var existingJobs
                var version = buildId.split('-')[0]

                console.log(jobs)

                existingJobs = allJobs[bucket]
                countt = 0
                _.forEach(existingJobs, function (components, os) {
                    _.forEach(components, function (jobNames, component) {
                        _.forEach(jobNames, function (name, job) {
                            if (!_.has(jobs['os'], os)){
                                jobs['os'][os] = {};
                            }
                            if (!_.has(jobs['os'][os], component)){
                                jobs['os'][os][component] = {};
                            }

                            // pending if job with name or display name doesn't exist
                            const isPending = jobs['os'][os][component][job] === undefined && Object.values(jobs['os'][os][component]).find(runs => runs[0].displayName === job) === undefined

                            if ((name.deleted === undefined || !name.deleted.includes(version)) &&
                                 bucket != "operator" && isPending &&
                                ((name.hasOwnProperty('jobs_in')) &&
                                    (name['jobs_in'].indexOf(version) > -1))) {
                                var pendJob = {}
                                pendJob['pending'] = name.totalCount
                                pendJob['totalCount'] = 0
                                pendJob['failCount'] = 0
                                pendJob['result'] = "PENDING"
                                pendJob['priority'] = name.priority
                                pendJob['url'] = name.url
                                pendJob['build_id'] = ""
                                pendJob['claim'] = ""
                                pendJob['deleted'] = false
                                pendJob['olderBuild'] = false
                                pendJob['duration'] = 0
                                pendJob['color'] = ''
                                pendJob['bugs'] = []
                                pendJob['triage'] = ''
                                pendJob['servers'] = []
                                if(name.hasOwnProperty('server_version')){
                                    pendJob['server_version'] = name.server_version
                                }
                                jobs['os'][os][component][job] = [pendJob]
                                countt = countt+1
                                
                                }
                        })
                    })
                })
                function clean(el) {
                    function internalClean(el) {
                        return _.transform(el, function(result, value, key) {
                            var isCollection = _.isObject(value);
                            var cleaned = isCollection ? internalClean(value) : value;

                            if (isCollection && _.isEmpty(cleaned)) {
                                return;
                            }

                            _.isArray(result) ? result.push(cleaned) : (result[key] = cleaned);
                        });
                    }

                    return _.isObject(el) ? internalClean(el) : el;
                }


                var cleaned =  jobs
                var toReturn = new Array()
                _.forEach(cleaned.os, function (components, os) {
                    _.forEach(components, function (jobNames, component) {
                        _.forEach(jobNames, function (jobs, jobName) {

                            var all_deleted = true;
                            _.forEach(jobs, function (jobDetail, job) {
                                if(!jobDetail['deleted']) {
                                    all_deleted = false;
                                }
                                var tempJob = _.cloneDeep(jobDetail)

                                if (tempJob["skipCount"] === undefined) {
                                    tempJob["skipCount"] = 0
                                }
                                if (tempJob["bugs"] === undefined) {
                                    tempJob["bugs"] = []
                                }
                                if (tempJob["triage"] === undefined) {
                                    tempJob["triage"] = ""
                                }
                                if (tempJob["servers"] === undefined) {
                                    tempJob["servers"] = []
                                }
                                tempJob["runCount"] = jobs.length;
                                if (tempJob["displayName"] === undefined) {
                                    tempJob["displayName"] = jobName
                                }

                                tempJob['build'] = cleaned.build
                                tempJob['name'] = jobName
                                tempJob['displayName'] = tempJob['displayName'] || jobName
                                tempJob['component'] = component
                                tempJob['os'] = os
                                toReturn[toReturn.length] = tempJob
                            })
                            if (all_deleted) {
                                if (jobName.deleted && jobName.deleted.includes(version)) {
                                    return;
                                }


                                let pendJob = {};
                                pendJob['build'] = cleaned.build;
                                pendJob['name'] = jobName;
                                pendJob['component'] = component;
                                pendJob['os'] = os;
                                pendJob['pending'] = jobName.totalCount
                                pendJob['totalCount'] = 0
                                pendJob['failCount'] = 0
                                pendJob['result'] = "PENDING"
                                pendJob['priority'] = jobName.priority
                                pendJob['url'] = jobName.url
                                pendJob['build_id'] = ""
                                pendJob['claim'] = ""
                                pendJob['deleted'] = false
                                pendJob['olderBuild'] = false
                                pendJob['duration'] = 0
                                pendJob['color'] = ''
                                pendJob['bugs'] = []
                                pendJob['triage'] = ''
                                pendJob['servers'] = []
                                if(existingJobs.hasOwnProperty('server_version')){
                                    pendJob['server_version'] = existingJobs.server_version
                                }
                                if(jobName.hasOwnProperty('jobs_in')
                                    && jobName['jobs_in'].indexOf(version) > -1) {
                                    toReturn[toReturn.length] = pendJob
                                }
                            }
                        })
                    })
                })
                return toReturn
            }

            if (build in buildsResponseCache){
                console.log("IN CACHE")
                var data = buildsResponseCache[build]
                getJobs();
                return Promise.resolve(data)
            } else {
                return getJobs()
            }

        },
        claimJobs: async function(type,bucket,name,build_id,claim,os,comp,version){
            const jobs_key = `${version}_${bucket}`;
            const majorVersion = version.split("-")[0]
            const triage_history_key = `${name}_${majorVersion}_${bucket}`;

            const jobs = await _getmulti("greenboard", [jobs_key]).then(jobs => jobs[jobs_key].value);
            let triage_history;
            try {
                triage_history = await _getmulti("triage_history", [triage_history_key]).then(triage_history => triage_history[triage_history_key].value);
            } catch(e) {
                triage_history = null;
            }
            const newbuildjobs = []
            const buildjobs = jobs["os"][os][comp][name]
            buildjobs.forEach(function (d) {
                if(d["build_id"] == build_id) {
                    if (type === "bugs") {
                        d.bugs = claim
                    } else if (type === "triage") {
                        d.triage = claim
                    }
                }
                newbuildjobs.push(d)    
            })
            jobs["os"][os][comp][name] = newbuildjobs
            console.log(jobs["os"][os][comp][name])
            await _upsert("greenboard", jobs_key, jobs);

            const build = parseInt(version.split("-")[1]);
            if (isNaN(build)) {
                throw Error("invalid build")
            }
            if (triage_history) {
                // overwrite with new build, reset other field to default
                if (build > triage_history.build) {
                    triage_history.build = build;
                    if (type === "bugs") {
                        triage_history.bugs = claim;
                        triage_history.triage = "";
                    } else if (type === "triage") {
                        triage_history.triage = claim;
                        triage_history.bugs = []
                    }
                }
                // update existing build
                else if (build === triage_history.build) {
                    if (type === "bugs") {
                        triage_history.bugs = claim;
                    } else if (type === "triage") {
                        triage_history.triage = claim;
                    }
                }
            } else {
                triage_history = {
                    bugs: type === "bugs" ? claim : [],
                    triage: type === "triage" ? claim : "",
                    build
                }
            }

            await doUpsert("triage_history", triage_history_key, triage_history);
            // update cache
            if (version in buildsResponseCache) {
                const jobToUpdate = buildsResponseCache[version].find(job => job.build_id === parseInt(build_id) && job.os === os && job.component === comp);
                if (jobToUpdate) {
                    if (type === "bugs") {
                        jobToUpdate.bugs = claim;
                    } else if (type === "triage") {
                        jobToUpdate.triage = claim;
                    }
                }
            }
        },
        getBuildSummary: function (buildId) {
            function getBuildDetails() {
                return _getmulti('greenboard', [buildId,'existing_builds']).then(function (result) {
                    if (!("summary" in buildsResponseCache)){
                        buildsResponseCache["summary"] = {}
                    }
                    buildsResponseCache["summary"][buildId] = result;
                    return processBuildDetails(result);
                })
            }

            function processBuildDetails(data) {
                var build = data[buildId].value;
                var allJobs = data['existing_builds'].value;
                var type = build.type;
		var version = buildId.split('-')[0]
                var existingJobs;
                if (type == "mobile"){
                    existingJobs = _.pick(allJobs, "mobile");
                }
                else {
                    existingJobs = _.omit(allJobs, "mobile");
                    existingJobs = _.merge(allJobs['server'], allJobs['build']);
                }
                _.forEach(existingJobs, function (components, os) {
                    _.forEach(components, function (jobNames, component) {
                        _.forEach(jobNames, function (name, job) {
                            if (!_.has(build['os'], os)){
                                build['os'][os] = {};
                            }
                            if (!_.has(build['os'][os], component)){
                                build['os'][os][component] = {};
                            }
                            if (!_.has(build['os'][os][component], job) && (job['jobs_in'].indexOf(version) > -1)){
                                var pendJob = {};
                                pendJob['pending'] = name.totalCount;
                                pendJob['totalCount'] = 0;
                                pendJob['failCount'] = 0;
                                pendJob['result'] = "PENDING";
                                pendJob['priority'] = name.priority;
                                pendJob['url'] = name.url;
                                pendJob['build_id'] = "";
                                pendJob['claim'] = "";
                                pendJob['deleted'] = false;
                                pendJob['olderBuild'] = false;
                                pendJob['disabled'] = false;
                                pendJob['duration'] = 0;
                                pendJob['color'] = '';
                                build['os'][os][component][job] = [pendJob];
                            }
                        })
                    })
                });

                function clean(el) {
                    function internalClean(el) {
                        return _.transform(el, function(result, value, key) {
                            var isCollection = _.isObject(value);
                            var cleaned = isCollection ? internalClean(value) : value;

                            if (isCollection && _.isEmpty(cleaned)) {
                                return;
                            }

                            _.isArray(result) ? result.push(cleaned) : (result[key] = cleaned);
                        });
                    }

                    return _.isObject(el) ? internalClean(el) : el;
                }

                var cleaned =  clean(build);

                var sumTotalCount = function (total, job) {
                    var totalCount = _.reduce(job, function (total, _job) {
                        if (_job.olderBuild || _job.disabled){
                            return total + 0;
                        }
                        return total + _job.totalCount;
                    }, 0);
                    return total + totalCount;
                };
                var sumFailCount = function (total, job) {
                    var failCount = _.reduce(job, function (total, _job) {
                        if (_job.olderBuild || _job.disabled){
                            return total + 0;
                        }
                        return total + _job.failCount;
                    }, 0);
                    return total + failCount;
                };
                var sumPendingCount = function (total, job) {
                    var pendingCount = _.reduce(job, function (total, _job) {
                        if (_job.olderBuild || _job.disabled){
                            return total + 0;
                        }
                        return total + (_job.pending || 0);
                    }, 0);
                    return total + pendingCount;
                };
                var  transformComponent = function (component) {
                    return {
                        totalCount: _.reduce(component, sumTotalCount, 0),
                        failCount: _.reduce(component, sumFailCount, 0),
                        pending: _.reduce(component, sumPendingCount, 0)
                    };
                };
                var transformOs = function (os) {
                    var transformedComponents = _.mapValues(os, transformComponent);
                    var totalCount = _.reduce(transformedComponents, function (total, component) {
                        return total + component.totalCount;
                    }, 0);
                    var failCount = _.reduce(transformedComponents, function (total, component) {
                        return total + component.failCount;
                    }, 0);
                    var pendingCount = _.reduce(transformedComponents, function (total, component) {
                        return total + component.pending;
                    }, 0);
                    transformedComponents['totalCount'] = totalCount;
                    transformedComponents['failCount'] = failCount;
                    transformedComponents['pending'] = pendingCount;
                    return transformedComponents;
                };

                cleaned.os = _.mapValues(cleaned.os, transformOs);

                return cleaned
            }

            if (("summary" in buildsResponseCache) && (buildId in buildsResponseCache["summary"])) {
                var data = buildsResponseCache["summary"][buildId];
                getBuildDetails();
                return Promise.resolve(processBuildDetails(data));
            }
            return getBuildDetails();

        },
        setBestRun: async function(bucket, name, build_id, os, comp, version) {
            const key = `${version}_${bucket}`
            build_id = parseInt(build_id);
            while (true) {
                try {
                    const res = await _getmulti("greenboard", [key]);
                    const cas = res[key].cas
                    const doc = res[key].value
                    for (const run of doc.os[os][comp][name]) {
                        if (run.olderBuild === false) {
                            doc.totalCount -= run.totalCount;
                            doc.failCount -= run.failCount;
                            run.olderBuild = true;
                        }
                        if (run.build_id === build_id) {
                            doc.totalCount += run.totalCount;
                            doc.failCount += run.failCount;
                            run.olderBuild = false;
                        }
                    }
                    await _upsert("greenboard", key, doc, cas);
                    if (version in buildsResponseCache) {
                        for (const run of buildsResponseCache[version].filter(job => job.os === os && job.component === comp && job.name === name)) {
                            run.olderBuild = true;
                        }
                        const bestRun = buildsResponseCache[version].find(job => job.build_id === build_id && job.os === os && job.component === comp);
                        if (bestRun) {
                            bestRun.olderBuild = false;
                        }
                    }
                    break;
                } catch (e) {
                    console.error(e)
                }
            }
        },
        rerunJob: async function(jobUrl, cherryPick) {
            const jenkins = getJenkins(jobUrl);
            const [,, name, numberStr] = new URL(jobUrl).pathname.split("/");

            if (!jenkins) {
                throw Error("Unsupported Jenkins server: " + new URL(jobUrl).origin)
            }

            const number = parseInt(numberStr);

            if (isNaN(number)) {
                throw Error("Invalid build id: " + numberStr);
            }

            const info = await jenkins.build.get(name, number);
            const parameters = getParameters(info);

            if (!parameters.dispatcher_params) {
                throw Error("Non dispatcher jobs not supported")
            }

            const dispatcherParams = JSON.parse(parameters.dispatcher_params.slice(11));
            
            // TODO: Remove when CBQE-6336 fixed
            if (!dispatcherParams.component) {
                throw Error("Invalid dispatcher params")
            }

            if (["ABORTED", "FAILURE"].includes(info.result)) {
                dispatcherParams.fresh_run = true;
            } else {
                dispatcherParams.fresh_run = false;
            }

            dispatcherParams.component = parameters.component;
            dispatcherParams.subcomponent = parameters.subcomponent;

            const [,, dispatcherName] = new URL(dispatcherParams.dispatcher_url).pathname.split("/")

            delete dispatcherParams.dispatcher_url;

            await jenkins.job.build({ name: dispatcherName, parameters: dispatcherParams });
            
        }
        
    };

    return API

}()

function getParameters(info) {
    const parameters = {}
    for (const a of info["actions"]) {
        if (a["_class"] === "hudson.model.ParametersAction") {
            for (const param of a["parameters"]) {
                if ("name" in param && "value" in param) {
                    parameters[param['name']] = param['value']
                }
            }
        }
    }
    return parameters
}


// number of jobs per os
// SELECT os,component, COUNT(*) as count fromserver GROUP BY os;
