//======TESTING=========
//var app = angular.module('greenboardControllers', ['greenboardServices']);
//======TESTING=========
var app = angular.module('greenboardControllers', ['greenboardDirectives', 'greenboardServices']);


app.controller('InitDataCtrl', ['$scope', 'ViewService', 'Data', '$location', InitDataCtrl]);
app.controller('SidebarCtrl', ['$scope', 'ViewService', 'Data', '$location', SidebarCtrl]);
app.controller('JobsCtrl', ['$scope', 'ViewService', 'Data', '$location', JobsCtrl]);
