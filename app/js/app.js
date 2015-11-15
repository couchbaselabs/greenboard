'usev strict'
var app = angular.module('greenBoard', [
  'ui.router',
  'svc.data',
  'svc.view',
  'ctl.timeline',
  'ctl.initdata',
  'ctl.sidebar',
  'ctl.jobs'
]);


app.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("/");

    $stateProvider
      .state('index', {
        url: "/",
        templateUrl: "view.html"
    })
  }]);
