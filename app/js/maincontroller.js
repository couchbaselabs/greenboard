angular.module('app.main', [])
    .controller("NavCtrl", ['$scope', '$state', '$stateParams', 'Data', 'target', 'targetVersions', 'version',
        function($scope, $state, $stateParams, Data, target, targetVersions, version){

            targetVersions = _.compact(targetVersions)
            Data.setTarget(target)
            Data.setSelectedVersion(version)
            Data.setTargetVersions(targetVersions)

            // activate build state
            $state.go("target.version.builds.build")

            // update target versions when drop down target changes
            $scope.changeTarget = function(target){
                if(target == 'cblite' || target == 'sync_gateway'){
                    Data.setBuildFilter(0)
                }
                else
                {
                    Data.setBuildFilter(2000)
                }
                $state.go("target.version", {target: target, version: "latest"})
            }

            // update target versions when drop down target changes
            $scope.changeVersion = function(newVersion){
                if(newVersion != version){
                    Data.setBuildsFilter(10)
                    //Data.setBuildFilter(2000)
                    $state.go("target.version", {version: newVersion})
                }
            }

        }])
    .controller('TimelineCtrl', ['$scope', '$state', 'versionBuilds', 'Data',
        function($scope, $state, versionBuilds, Data){
            $scope.versionBuilds = versionBuilds
            
            // on build change reload jobs view
            $scope.onBuildChange = function(build){
                $scope.build = build
                Data.setBuild(build)
                if(build.indexOf("-") != -1){ build = build.split("-")[1]}
                $state.go("target.version.builds.build", {build: build})
            }

            // when build changes update timeline title
            $scope.$watch(function(){ return Data.getBuild()},
                function(build){
                    $scope.build = build
                })

            // activate generic build state
            $state.go("target.version.builds.build", {build: "latest"})
        }])


    .controller('JobsCtrl', ['$scope', '$state', '$stateParams', 'Data', 'buildJobs', 'claimSummary',
       function($scope, $state, $stateParams, Data, buildJobs, claimSummary){

            $scope.claimSummary = claimSummary.filter(function(cl) { return cl["claim"] !== "Other" })
            $scope.totalClaims = $scope.claimSummary.reduce(function(a, b) { return a + b["count"] }, 0)
            $scope.needToAnalyseCount = buildJobs.filter(function(job) { return !["PENDING", "SUCCESS"].includes(job["result"]) || (job["result"] === "PENDING" && job["claim"] !== "") }).length
            $scope.analysedPercent = $scope.needToAnalyseCount == 0 ? 0 :  (($scope.totalClaims/$scope.needToAnalyseCount)*100).toFixed(0)
            $scope.showAnalysis = true
            $scope.changeShowAnalysis = function() {
                $scope.showAnalysis = !$scope.showAnalysis
            }

            // order by name initially
            $scope.predicate = "result"
            $scope.reverse = true
            $scope.activePanel = 0

            

                $scope.onselect = 
                    function(jobname,os,comp){
                        var activeJobs = Data.getActiveJobs()
                        // activeJobs = _.reject(activeJobs, "olderBuild", true)
                        activeJobs = _.reject(activeJobs, "deleted", true)
                        
                        var filters = {"name":jobname,"os":os,"component":comp}
                        var requiredJobs = activeJobs
                        _.forEach(filters, function(value, key) {
                            requiredJobs = _.filter(requiredJobs, [key,value]);
                        });

                            // requiredJobs = _.filter(activeJobs,["name",jobname,"os"])
                            $scope.len = requiredJobs.length
                            $scope.selectedjobdetails = requiredJobs
                            $scope.selectedjobname = jobname
                            $scope.selectedbuild = requiredJobs[0].build
                    }
                
            

            function updateScopeWithJobs(jobs){

                jobs = _.reject(jobs, "olderBuild", true)
                jobs = _.reject(jobs, "deleted", true)
                var jobsCompleted = _.uniq(_.reject(jobs, ["result", "PENDING"]))
                var jobsUnstable = _.uniq(_.filter(jobs, ["result", "UNSTABLE"]))
                var jobsFailed = _.uniq(_.filter(jobs, ["result", "FAILURE"]))
                var jobsPending = _.uniq(_.filter(jobs, ["result", "PENDING"]))
                

                $scope.panelTabs = [
                    {title: "Jobs Completed", jobs: jobsCompleted, active: true},
                    {title: "Jobs Unstable", jobs: jobsUnstable},
                    {title: "Jobs Failed", jobs: jobsFailed},
                    {title: "Jobs Pending", jobs: jobsPending}
                ]                
            }

            function getJobs() {
                var build = Data.getBuild()
                //var jobs = buildJobs[build].value
                //var allJobs = buildJobs['existing_builds'].value
                //var toReturn = processJob(jobs, allJobs)
                return buildJobs
            }

            function processJob(jobs, allJobs) {
                var type = jobs.type
                var existingJobs
		        var version = Data.getSelectedVersion()
                if (type == "mobile"){
                    existingJobs = _.pick(allJobs, "mobile")
                }
                else {
                    existingJobs = _.omit(allJobs, "mobile")
                    existingJobs = _.merge(allJobs['server'], allJobs['build'])
                    fs = require('fs');
                    fs.writeFile("merge.json", existingJobs)
                }
                _.forEach(existingJobs, function (components, os) {
                    _.forEach(components, function (jobNames, component) {
                        _.forEach(jobNames, function (name, job) {
                            if (!_.has(jobs['os'], os)){
                                jobs['os'][os] = {};
                            }
                            if (!_.has(jobs['os'][os], component)){
                                jobs['os'][os][component] = {};
                            }
                            if (!_.has(jobs['os'][os][component], job) && 
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
                                jobs['os'][os][component][job] = [pendJob]
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
                var cleaned =  clean(jobs)
                var toReturn = new Array()

                _.forEach(cleaned.os, function (components, os) {
                    _.forEach(components, function (jobNames, component) {
                        _.forEach(jobNames, function (jobs, jobName) {
                            _.forEach(jobs, function (jobDetail, job) {
                                var tempJob = _.cloneDeep(jobDetail)
                                tempJob['build'] = cleaned.build
                                tempJob['name'] = jobName
                                tempJob['component'] = component
                                tempJob['os'] = os
                                toReturn[toReturn.length] = tempJob
                            })
                        })
                    })
                })

                return toReturn
            }

            var jobs = getJobs()
            updateScopeWithJobs(jobs)
            Data.setBuildJobs(jobs)
            // set sidebar items from build job data
            var allPlatforms = _.uniq(_.map(jobs, "os"))
                .map(function(k){
                    return {key: k, disabled: false}
                })
            var allFeatures = _.uniq(_.map(jobs, "component"))
                .map(function(k){
                    return {key: k, disabled: false}
                })
            var allVersions = _.uniq(_.map(buildJobs, "server_version"))
                .map(function (k) {
                    return k ? {key: k, disabled: false}: null
                })

            Data.setSideBarItems({platforms: allPlatforms, features: allFeatures, serverVersions: allVersions});



            $scope.changePanelJobs = function(i){
                $scope.activePanel = i
            }

            $scope.msToTime = msToTime
            $scope.$watch(function(){ return Data.getActiveJobs() },
                function(activeJobs){
                    if(activeJobs){
                        updateScopeWithJobs(activeJobs)
                    }
                })


        }])
    .controller('JobDetailsCtrl',['$scope','$state','$stateParams','Data','target',
                function($scope,$state,$stateParams,Data,target){
                    
                    
                    $scope.msToTime = msToTime
                    var jobname = $stateParams.jobName
                    
                    $scope.$watch(function(){
                        return Data.getActiveJobs()
                    },
                        function(activeJobs){
                            // activeJobs = _.reject(activeJobs, "olderBuild", true)
                            activeJobs = _.reject(activeJobs, "deleted", true)
                            
                            var requiredJobs = _.filter(activeJobs,["name",jobname])
                                $scope.jobDetails = requiredJobs
                           
                                $scope.jobname = jobname
                                $scope.build = requiredJobs[0].build
                        }
                    )

    }])

    .directive('claimCell', ['Data', 'QueryService', function(Data, QueryService){
        return {
            restrict: 'E',
            scope: {job: "="},
            templateUrl: 'partials/claimcell.html',
            link: function(scope, elem, attrs){

                if(scope.job.customClaim){  // override claim
                    scope.job.claim = scope.job.customClaim
                }

                var oldClaim = ""
                
                $(elem).mouseover(function(){
                    if(scope.job.claim != ""){
                        oldClaim = scope.job.claim
                    }
                    else{
                        oldClaim = "No Claim for this build"
                    }
                    $('[data-toggle="popover"]').popover({
                        placement : 'top',
                        trigger : 'hover',
                        content : scope.job.claim
                    });
                
                });
                // publish on blur
                scope.editClaim = false
                scope.saveClaim = function(){
                    // publish
                    var target = Data.getCurrentTarget()
                    var name = scope.job.name
                    var build_id = scope.job.build_id
                    var claim = scope.job.claim
                    var os = scope.job.os
                    var comp = scope.job.component
                    var version = scope.job.build
                    QueryService.claimJob(target, name, build_id, claim,os,comp,version)
                        .catch(function(err){
                            scope.job.claim = "error saving claim: "+err.err
                        })
                    scope.editClaim = false

                }
                scope.showFullClaim = false
                scope.changeShowFullClaim = function() {
                    scope.showFullClaim = !scope.showFullClaim
                    scope.updateClaim()
                }
                scope.updateClaim = function() {
                    scope.claim = (scope.showFullClaim || scope.job.claim.length < 100) ? scope.job.claim : scope.job.claim.split('<br><br>')[0].slice(0, 100) + '...'
                }
                scope.updateClaim()
            }
        }
    }])




// https://coderwall.com/p/wkdefg/converting-milliseconds-to-hh-mm-ss-mmm
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

