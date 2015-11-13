'usev strict'
var app = angular.module('greenBoard', [
  'ngRoute',
  'greenboardControllers',
  'greenboardServices',
  'DataFactory',
  'app.timelinectrl',
  'greenboardDirectives',
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
