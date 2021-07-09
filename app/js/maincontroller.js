var jiraPrefixes = ["MB", "CBQE", "CBIT", "CBD", "CBSP"]

formatClaim = function(claim) {
    var claimHtml = claim
    _.forEach(jiraPrefixes, function(prefix) {
        if (claim.startsWith(prefix + "-")) {
            claimHtml = '<a target="_blank" href="https://issues.couchbase.com/browse/' + claim + '">' + claim + '</a>'
            return false;
        }
    })
    return claimHtml
}

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


    .controller('JobsCtrl', ['$rootScope', '$scope', '$state', '$stateParams', 'Data', 'buildJobs', 'QueryService',
       function($rootScope, $scope, $state, $stateParams, Data, buildJobs, QueryService){

            var CLAIM_MAP = {
                "git error": ["hudson.plugins.git.GitException", "python3: can't open file 'testrunner.py': [Errno 2] No such file or directory"],
                "SSH error": ["paramiko.ssh_exception.SSHException", "Exception SSH session not active occurred on"],
                "IPv6 test on IPv4 host": ["Cannot enable IPv6 on an IPv4 machine"],
                "Python SDK error (CBQE-6230)": ["ImportError: cannot import name 'N1QLQuery' from 'couchbase.n1ql'"],
                "Syntax error": ["KeyError:", "TypeError:"],
                "json.decoder.JSONDecodeError:": ["json.decoder.JSONDecodeError:"],
                "ServerUnavailableException: unable to reach the host": ["ServerUnavailableException: unable to reach the host"],
                "Node already added to cluster": ["ServerAlreadyJoinedException:"],
                "CBQ Error": ["membase.api.exception.CBQError:", "CBQError: CBQError:"],
                "RBAC error": ["Exception: {\"errors\":{\"roles\":\"Cannot assign roles to user because the following roles are unknown, malformed or role parameters are undefined: [security_admin]\"}}"],
                "Rebalance error": ["membase.api.exception.RebalanceFailedException"],
                "Build download failed": ["Unable to copy build to", "Unable to download build in"],
                "install not started": ["INSTALL NOT STARTED ON"],
                "install failed": ["INSTALL FAILED ON"],
                "No test report xml": ["No test report files were found. Configuration error?"]
            }

            $scope.formatClaim = formatClaim

            $scope.openClaims = new Set()
            $scope.openClaim = function(jobName) {
                $scope.openClaims.add(jobName);
            }
            $scope.closeClaim = function(jobName) {
                $scope.openClaims.remove(jobName);
            }

            function getClaimSummary(jobs) {
                var claimCounts = {
                    "Analyzed": 0
                }
                var totalClaims = 0
                _.forEach(Object.keys(CLAIM_MAP), function(claim) {
                    claimCounts[claim] = {
                        jobCount: 0,
                        skippedTestCount: 0,
                        failedTestCount: 0
                    };
                })
                var jiraCounts = {}
                _.forEach(jiraPrefixes, function(prefix) {
                    jiraCounts[prefix] = 0;
                })
                var uniqueBugs = {}
                _.forEach(jiraPrefixes, function(prefix) {
                    uniqueBugs[prefix] = [];
                })
                _.forEach(jobs, function(job) {
                    var foundInJob = [];
                    _.forEach(job["bugs"], function(bug) {
                        try {
                            var prefix = bug.split("-")[0]
                            if (jiraPrefixes.includes(prefix)) {
                                if (!foundInJob.includes(bug)) {
                                    if (claimCounts[bug]) {
                                        claimCounts[bug].jobCount += 1;
                                        claimCounts[bug].failedTestCount += job["failCount"]
                                        claimCounts[bug].skippedTestCount += job["skipCount"]
                                    } else {
                                        claimCounts[bug] = {
                                            jobCount: 1,
                                            failedTestCount: job["failCount"],
                                            skippedTestCount: job["skipCount"]
                                        }
                                    }
                                    jiraCounts[prefix] += 1;
                                    foundInJob.push(bug);
                                }
                                if (!uniqueBugs[prefix].includes(bug)) {
                                    uniqueBugs[prefix].push(bug)
                                }
                            }
                            
                        } catch (e) {
                            console.error(e)
                        }
                    })
                    _.forEach(job["claim"].split("<br><br>"), function(jobClaim) {
                        if (jobClaim !== "" && !job["olderBuild"]) {
                            _.forEach(Object.keys(claimCounts), function(claim) {
                                if (jobClaim.startsWith(claim)) {
                                    if (!foundInJob.includes(claim)) {
                                        foundInJob.push(claim);
                                        claimCounts[claim].jobCount += 1;
                                        claimCounts[claim].failedTestCount += job["failCount"]
                                        claimCounts[claim].skippedTestCount += job["skipCount"]
                                    }
                                    return false;
                                }
                            })
                        }
                    })
                   
                })
                var claims = []
                _.forEach(Object.entries(claimCounts), function(entry) {
                    var jobCount = entry[1].jobCount
                    var failedTestCount = entry[1].failedTestCount
                    var skippedTestCount = entry[1].skippedTestCount
                    if (jobCount > 0) {
                        totalClaims += jobCount
                        claims.push({ claim: entry[0], skippedTestCount: skippedTestCount, failedTestCount: failedTestCount, jobCount: jobCount })
                    }
                })
                uniqueBugs["IT"] = uniqueBugs["CBD"].concat(uniqueBugs["CBIT"])
                delete uniqueBugs["CBD"]
                delete uniqueBugs["CBIT"]
                jiraCounts["IT"] = jiraCounts["CBD"] + jiraCounts["CBIT"]
                delete jiraCounts["CBD"]
                delete jiraCounts["CBIT"]
                $scope.jiraCounts = Object.entries(jiraCounts).map(function(jiraCount) {
                    var prefix = jiraCount[0]
                    var name
                    if (prefix === "MB") {
                        name = "Product bugs (MB)"
                    } else if (prefix === "CBQE") {
                        name = "Test bugs (CBQE)"
                    } else if (prefix === "IT") {
                        name = "IT bugs (CBIT/CBD)"
                    } else if (prefix === "CBSP") {
                        name = "Support bugs (CBSP)"
                    }
                    return { 
                        name: name,
                        count: jiraCount[1],
                        percent: totalClaims == 0 ? 0 : ((jiraCount[1]/totalClaims)*100).toFixed(0),
                        unique: uniqueBugs[prefix].length
                    }
                })
                .filter(function(jiraCount) {
                    return jiraCount.count > 0;
                })
                $scope.claimSummary = claims;
                $scope.totalClaims = totalClaims
                $scope.needToAnalyseCount = jobs.filter(function(job) { return !job["olderBuild"] && !job["deleted"] && (!["PENDING", "SUCCESS"].includes(job["result"]) || (job["result"] === "PENDING" && job["claim"] !== "")) }).length
                $scope.analysedPercent = $scope.needToAnalyseCount == 0 ? 0 :  (($scope.totalClaims/$scope.needToAnalyseCount)*100).toFixed(0)
            }

            $scope.jiraCounts = []
            $scope.showAnalysis = true
            $scope.changeShowAnalysis = function() {
                $scope.showAnalysis = !$scope.showAnalysis
            }

            // order by name initially
            $scope.predicate = "result"
            $scope.reverse = true
            $scope.activePanel = 0

            function setJobsPerPage(jobsPerPage) {
                if (jobsPerPage === "All") {
                    jobsPerPage = $scope.panelTabs[$scope.activePanel].jobs.length;
                }
                $scope.jobsPerPage = jobsPerPage;
                if ($scope.jobsPage > Math.max(0, $scope.numPages() - 1)) {
                    Data.setJobsPage($scope.numPages() - 1);
                }
            }

            $scope.targetBy = Data.getCurrentTarget();

            $scope.jobsPerPage = Data.getJobsPerPage();
            $scope.jobsPage = Data.getJobsPage();
            $scope.$watch(function() { return Data.getJobsPage() }, function(jobsPage) {
                $scope.jobsPage = jobsPage;
            })
            $scope.$watch(function() { return Data.getJobsPerPage() }, function(jobsPerPage) {
                setJobsPerPage(jobsPerPage);
            })

            $scope.nextPage = function() {
                if ($scope.nextPageExists()) {
                    Data.setJobsPage($scope.jobsPage + 1);
                }
            }
            $scope.prevPage = function() {
                if ($scope.jobsPage > 0) {
                    Data.setJobsPage($scope.jobsPage - 1);
                }
            }
            $scope.nextPageExists = function() {
                jobsLength = $scope.panelTabs[$scope.activePanel].jobs.length;
                return ($scope.jobsPage + 1) * $scope.jobsPerPage < jobsLength - 1;
            }
            $scope.setPage = function () {
                Data.setJobsPage(this.n);
            };
            $scope.numPages = function() {
                jobsLength = $scope.panelTabs[$scope.activePanel].jobs.length;
                if ($scope.jobsPerPage === 0) {
                    return 0;
                }
                return Math.ceil(jobsLength / $scope.jobsPerPage);
            }
            $scope.pageNumbers = function() {
                var start = $scope.jobsPage - 5;
                if (start < 0) {
                    start = 0;
                }
                var end = $scope.jobsPage + 5;
                var numPages = $scope.numPages();
                if (end > numPages) {
                    end = numPages;
                }
                return _.range(start, end);
            }
            function resetPage() {
                Data.setJobsPage(0);
                if (Data.getJobsPerPage() === "All") {
                    $scope.jobsPerPage = $scope.panelTabs[$scope.activePanel].jobs.length;
                }
            }
            

                $scope.onselect = 
                    function(jobname,os,comp,variants){
                        var activeJobs = Data.getActiveJobs()
                        var target = Data.getCurrentTarget()
                        // activeJobs = _.reject(activeJobs, "olderBuild", true)
                        activeJobs = _.reject(activeJobs, "deleted", true)
                        
                        var requiredJobs = activeJobs.filter(function(job) {
                            return job.name === jobname && job.os === os && job.component === comp
                        })

                        $scope.model = {};
                        $scope.model.bestRun = requiredJobs.find(function(job) { return job.olderBuild === false; }).build_id.toString();
                        $scope.model.changeBestRun = function() {
                            if ($scope.model.bestRun !== undefined) {
                                _.forEach($scope.selectedjobdetails, function(job) {
                                    if (job.build_id === parseInt($scope.model.bestRun)) {
                                        job.olderBuild = false;
                                    } else {
                                        job.olderBuild = true;
                                    }
                                })
                                var updatedJobs = Data.getActiveJobs();
                                updateScopeWithJobs(updatedJobs, false);
                                $rootScope.$broadcast("recalculateStats");
                                QueryService.setBestRun(target, jobname, $scope.model.bestRun, os, comp, $scope.selectedbuild)
                            }
                        }

                            // requiredJobs = _.filter(activeJobs,["name",jobname,"os"])
                            $scope.len = requiredJobs.length
                            $scope.selectedjobdetails = requiredJobs
                            $scope.selectedjobname = requiredJobs[0].displayName
                            $scope.selectedbuild = requiredJobs[0].build
                    }
                
            $scope.search = ""
            $scope.onSearchChange = function() {
                jobs = Data.getActiveJobs()
                updateScopeWithJobs(jobs)
            }
            $scope.searchClaim = function(claim) {
                if ($scope.search === claim) {
                    $scope.search = ""
                } else {
                    $scope.search = claim
                }
                $scope.onSearchChange()
            }

            function updateScopeWithJobs(jobs, reset){
                if (reset === undefined) {
                    reset = true;
                }

                jobs = _.reject(jobs, "olderBuild", true)
                jobs = _.reject(jobs, "deleted", true)
                if ($scope.search !== "") {
                    jobs = _.reject(jobs, function(job) { 
                        return !(job.bugs.includes($scope.search) ||
                                job.claim.includes($scope.search) ||
                                job.name.includes($scope.search) || 
                                job.triage.includes($scope.search)) 
                    })
                }
                var jobsCompleted = _.uniq(_.reject(jobs, ["result", "PENDING"]))
                var jobsSuccess = _.uniq(_.filter(jobs, ["result", "SUCCESS"]))
                var jobsAborted = _.uniq(_.filter(jobs, ["result", "ABORTED"]))
                var jobsUnstable = _.uniq(_.filter(jobs, ["result", "UNSTABLE"]))
                var jobsFailed = _.uniq(_.filter(jobs, ["result", "FAILURE"]))
                var jobsPending = _.uniq(_.filter(jobs, ["result", "PENDING"]))
                var jobsSkip = _.uniq(_.filter(jobs, function(job) { return job["skipCount"] > 0 }))
                

                $scope.panelTabs = [
                    {title: "Jobs Completed", jobs: jobsCompleted, active: true},
                    {title: "Jobs Success", jobs: jobsSuccess},
                    {title: "Jobs Aborted", jobs: jobsAborted},
                    {title: "Jobs Unstable", jobs: jobsUnstable},
                    {title: "Jobs Failed", jobs: jobsFailed},
                    {title: "Jobs Skipped", jobs: jobsSkip},
                    {title: "Jobs Pending", jobs: jobsPending},
                ]                

                $scope.variantNames = []
                _.forEach(jobs, function(job) {
                    if (job.variants) {
                        _.forEach(job.variants, function(_, variant) {
                            if (!$scope.variantNames.includes(variant)) {
                                $scope.variantNames.push(variant)
                            }
                        })
                    }
                })
                // sort variant names, ignore case
                $scope.variantNames.sort(function(a, b) { 
                    var ia = a.toLowerCase();
                    var ib = b.toLowerCase();
                    return ia < ib ? -1 : ia > ib ? 1 : 0;
                })

                $scope.variantName = function(name) {
                    return name.split("_").map(function(part) {
                        return part[0].toUpperCase() + part.slice(1)
                    }).join(" ")
                }

                getClaimSummary(jobs)
                if (reset) {
                    resetPage();
                }
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
            var allVersions = _.uniq(_.map(_.filter(buildJobs, function(job) { return job.server_version !== undefined }), "server_version"))
                .map(function (k) {
                    return {key: k, disabled: false}
                })

            var sidebarItems = {platforms: allPlatforms, features: allFeatures, serverVersions: allVersions }
            var allVariants = []

            _.forEach(jobs, function(job) {
                if (job.variants) {
                    _.forEach(Object.keys(job.variants), function(variant) {
                        if (!allVariants.includes(variant)) {
                            allVariants.push(variant)
                        }
                    })
                }
            })

            _.forEach(allVariants, function(variant) {
                sidebarItems[variant] = _.uniq(_.map(_.filter(jobs, function(job) { return job.variants && job.variants[variant] !== undefined }), "variants."+variant))
                .map(function (k) {
                    return {key: k, disabled: false}
                })
            })

            Data.setSideBarItems(sidebarItems);



            $scope.changePanelJobs = function(i){
                $scope.activePanel = i
                resetPage();
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
                    
                    $scope.openClaims = []
                    
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
    .directive("claimTest", [function() {
        return {
            scope: {claim: "="},
            templateUrl: "partials/claim.html",
            link: function(scope) {
                var jobName = scope.$parent.job.name;
                scope.formatClaim = formatClaim
                scope.shortClaim = (scope.claim.length < 100) ? scope.claim : scope.claim.split('<br><br>')[0].slice(0, 100) + '...'
                scope.scope = {
                    showFullClaim: scope.$parent.$parent.openClaims.has(jobName),
                    changeShowFullClaim: function() {
                        if (this.showFullClaim) {
                            scope.$parent.$parent.openClaims.delete(jobName)
                        } else {
                            scope.$parent.$parent.openClaims.add(jobName)
                        }
                        this.showFullClaim = !this.showFullClaim
                    }
                }
            }
        }
    }])

    .directive('claimCell', ['Data', 'QueryService', function(Data, QueryService){
        return {
            restrict: 'E',
            scope: {job: "="},
            templateUrl: 'partials/claimcell.html',
            link: function(scope, elem, attrs){
                scope.editClaim = false;
                scope.scope = {
                    bugsText: scope.job.bugs.join(", "),
                    saveClaim: function() {
                        var bugs = this.bugsText
                        var validBugs = true;
                        if (bugs === "") {
                            bugs = []
                        } else {
                           bugs = bugs.split(",").map(function (bug) { return bug.trim() })
                           _.forEach(bugs, function(bug) {
                                console.log(bug)
                                var validBug = false;
                                _.forEach(jiraPrefixes, function(prefix) {
                                    if (bug.startsWith(prefix + "-") && !isNaN(bug.split("-")[1])) {
                                        validBug = true;
                                    }
                                })
                                if (!validBug) {
                                    validBugs = false;
                                    return false;
                                }
                            })
                        }
                        if (validBugs) {
                            scope.job.bugs = bugs
                            var target = Data.getCurrentTarget()
                            var name = scope.job.name
                            var build_id = scope.job.build_id
                            var bugs = scope.job.bugs
                            var os = scope.job.os
                            var comp = scope.job.component
                            var version = scope.job.build
                            QueryService.claimJob("bugs", target, name, build_id, bugs, os, comp, version)
                                .catch(function(err){
                                    alert("error saving claim: "+err.err)
                                }).then(function() {
                                    scope.editClaim = false;
                                })
                        } else {
                            alert("Invalid bugs list, must be " + jiraPrefixes.join(", "))
                        }
                    }
                }
                scope.formatBugs = function() {
                    return scope.job.bugs.map(function(bug) {
                        return '<a target="_blank" href="https://issues.couchbase.com/browse/' + bug + '">' + bug + '</a>'
                    }).join(", ")
                }
            }
        }
    }])

    .directive('triageCell', ['Data', 'QueryService', function(Data, QueryService){
        return {
            restrict: 'E',
            scope: {job: "="},
            templateUrl: 'partials/triagecell.html',
            link: function(scope, elem, attrs){
                scope.editClaim = false;
                scope.saveClaim = function() {
                    var target = Data.getCurrentTarget()
                    var name = scope.job.name
                    var build_id = scope.job.build_id
                    var triage = scope.job.triage
                    var os = scope.job.os
                    var comp = scope.job.component
                    var version = scope.job.build
                    QueryService.claimJob("triage", target, name, build_id, triage, os, comp, version)
                        .catch(function(err){
                            alert("error saving claim: "+err.err)
                        }).then(function() {
                            scope.editClaim = false;
                        })
                }

            }
        }
    }])
    .directive('pagination', ['Data', function(Data) {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'partials/pagination.html',
            link: function(scope, element, attrs) {
                scope.jobsPage = Data.getJobsPage();
                scope.nextPageExists = scope.$parent.nextPageExists;
                scope.pageNumbers = scope.$parent.pageNumbers;
                scope.nextPage = scope.$parent.nextPage;
                scope.prevPage = scope.$parent.prevPage;
                scope.setPage = scope.$parent.setPage;
                scope.jobsPerPageChoices = [20, 50, 100, 500, 1000, 'All'];
                scope.jobsPerPage = Data.getJobsPerPage();

                scope.$watch(function() { return Data.getJobsPage() }, function(jobsPage) {
                    scope.jobsPage = jobsPage;
                })

                scope.$watch(function() { return Data.getJobsPerPage() }, function(jobsPerPage) {
                    scope.jobsPerPage = jobsPerPage;
                })

                scope.onJobsPerPageChange = function() {
                    Data.setJobsPerPage(scope.jobsPerPage);
                }

            }
        }

    }])
    .directive('rerunButton', ['QueryService', function(QueryService){
        return {
            restrict: 'E',
            scope: {job: "="},
            templateUrl: 'partials/rerun_button.html',
            link: function(scope, elem, attrs){
                scope.submitting = false;
                scope.error = false;
                scope.dispatched = false;
                scope.rerunJob = function() {
                    if (!confirm("Rerun " + scope.job.name + "?")) {
                        return;
                    }
                    scope.error = false;
                    scope.submitting = true;
                    scope.dispatched = false;
                    QueryService.rerunJob(scope.job.url + scope.job.build_id, null)
                        .then(function() {
                            scope.submitting = false;
                            scope.dispatched = true;
                        })
                        .catch(function(e) {
                            scope.submitting = false;
                            scope.error = true;
                            if (e.data.err) {
                                alert(e.data.err);
                            }
                        })
                }
                scope.btnText = function() {
                    if (scope.error) {
                        return "Error dispatching";
                    }
                    if (scope.submitting) {
                        return "Dispatching...";
                    }
                    if (scope.dispatched) {
                        return "Dispatched";
                    }
                    return "Rerun";
                }
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

