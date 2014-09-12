'usev strict'
var app = angular.module('greenBoard', [
  'ngRoute',
  'greenboardControllers',
  'greenboardServices'
]);

app.config(['$routeProvider',
  function($routeProvider){
    $routeProvider.
      when('/', {
        templateUrl: 'view.html'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);
