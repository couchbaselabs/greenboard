'usev strict'
var app = angular.module('greenBoard', [
  'ngRoute',
  'greenboardServices',
  'app.datafactory',
  'app.timelinectrl',
  'app.initdatactrl',
  'app.sidebarctrl',
  'app.jobsctrl',
  'greenboardDirectives'
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
