'usev strict'
var app = angular.module('greenBoard', [
  'ngRoute',
  'greenboardServices',
  'svc.data',
  'ctl.timeline',
  'ctl.initdata',
  'ctl.sidebar',
  'ctl.jobs',
]);


app.config(['$routeProvider',
  function($routeProvider){
    $routeProvider.
      when('/', {
        templateUrl: 'view.html',
        reloadOnSearch: false
      }).
      when('/home', {
        templateUrl: 'view.html',
        reloadOnSearch: false
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);
