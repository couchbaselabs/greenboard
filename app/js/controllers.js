//======TESTING=========
//var app = angular.module('greenboardControllers', ['greenboardServices']);
//======TESTING=========
var app = angular.module('greenboardControllers', ['nvd3ChartDirectives', 'greenboardServices']);


app.controller('TimelineCtrl',
           ['$scope', 'ViewService', 'Data', '$location', TimelineCtrl]);

app.controller('SidebarCtrl', ['$scope', 'CommonService', 'Data', SidebarCtrl]);
