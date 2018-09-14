'usev strict'

var app = angular.module('greenBoard', [
    'ngSanitize',
    'ngAnimate',
    'ui.router',
    'svc.data',
    'svc.query',
    'svc.timeline',
    'app.main',
    'app.target',
    'app.sidebar',
    'app.infobar'
]);

app.run(['$location', '$rootScope', 'Data', function($location, $rootScope, Data){

    function initUrlParams(){
        // sets data service job filter params
        // based on options passed in from url
        var params = $location.search()
        Data.setUrlParams(params)
    }

    // detect if jobs need to be filtered by url params on init
    initUrlParams()

    // preserve url params between state changes
    $rootScope.$on('$stateChangeStart', function(e, to, tp, from, fp){
        initUrlParams()
    })
}])


app.config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider){

        // TODO: external bootstrap with now testing build!
        $urlRouterProvider.otherwise("/server/6.0.0/latest");
        $stateProvider
            .state('target', {
                url: "/:target",
                abstract: true,
                template: '<ui-view/>',
                resolve: {
                    target: ['$stateParams', function($stateParams){
                        return $stateParams.target
                    }],
                    targetVersions: ['$stateParams', 'Data', 'QueryService',
                        function($stateParams, Data, QueryService){

                            var target = $stateParams.target
                            var versions = Data.getTargetVersions(target)
                            if(!versions){
                                // get versions for Target
                                versions = QueryService.getVersions(target)
                            }
                            return versions
                        }]
                }
            })
            .state('target.version', {
                url: "/:version",
                templateUrl: "view.html",
                controller: "NavCtrl",
                resolve: {
                    version: ['$stateParams', '$state', '$location', 'targetVersions', 'target',
                        function($stateParams, $state, $location, targetVersions, target){

                            var version = $stateParams.version || "latest"
                            if ((version == "latest") || targetVersions.indexOf(version) == -1){
                                // uri is either latest version or some unknown version of target
                                // just use latested known version of target
                                version = targetVersions[targetVersions.length-1]
                            }
                            $stateParams.version = version
                            return version
                        }],
                    testsFilter: ['$stateParams', '$state', 'Data',
                    function ($stateParams, $state, Data) {
                        Data.setBuildFilter()
                        $stateParams.testsFilter = Data.getBuildFilter()
                        return $stateParams.testsFilter
                    }],
                    buildsFilter: ['$stateParams', '$state', 'Data',
                    function ($stateParams, $state, Data) {
                        Data.setBuildsFilter()
                        $stateParams.buildsFilter = Data.getBuildsFilter()
                        return $stateParams.buildsFilter
                    }]
                }
            })
            .state('target.version.builds', {
                templateUrl: "partials/timeline.html",
                controller: "TimelineCtrl",
                resolve: {
                    versionBuilds: ['$stateParams', 'QueryService', 'Data', 'target', 'version', 'testsFilter',
                        'buildsFilter',
                        function($stateParams, QueryService, Data, target, version, testsFilter, buildsFilter){
                            return QueryService.getBuilds(target, version, testsFilter, buildsFilter).then(function(builds){
                                Data.setBuildFilter()
                                Data.setVersionBuilds(builds)
                                return Data.getVersionBuilds()
                            })
                        }]
                }
            })
            .state('target.version.builds.build', {
                url: "/:build",
                template: "<ui-view />",
                controller: ['$state', 'build', 'Data', function($state, build, Data){
                    // forwarder
                    Data.setBuild(build)
                    $state.go('target.version.builds.build.jobs')
                }],
                resolve: {
                    build: ['$stateParams', '$state', 'versionBuilds',
                        function($stateParams, $state, versionBuilds){
                            var build = $stateParams.build || "latest"
                            if((build == "latest") && (versionBuilds.length > 0)){
                                var vbuild = versionBuilds[versionBuilds.length-1].build
                                $stateParams.build = vbuild.split('-')[1]
                            } else if(versionBuilds.length <= 0){
                                $state.go('target.version.builds', {target: $stateParams.target, version: $stateParams.version})
                            }
                            return $stateParams.build
                        }]
                }
            })
            .state('target.version.builds.build.jobs', {
                templateUrl: "partials/jobs.html",
                controller: "JobsCtrl",
                resolve: {
                    buildJobs: ['$stateParams', 'QueryService', 'Data', 'target',
                        function($stateParams, QueryService, Data, target){
                            var build = Data.getBuild()
                            return QueryService.getJobs(build, target)
                        }]
                }
            })

    }]);
