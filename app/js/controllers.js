//======TESTING=========
//var app = angular.module('greenboardControllers', ['greenboardServices']);
//======TESTING=========
var app = angular.module('greenboardControllers', ['greenboardDirectives', 'greenboardServices']);


app.controller('JobsCtrl', ['$scope', 'ViewService', 'Data', '$location', JobsCtrl]);
