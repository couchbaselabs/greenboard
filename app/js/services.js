var app = angular.module('greenboardServices', []);

app.service("ViewService",['$http', ViewService]);
app.service("CommonService",['ViewService', 'Data', CommonService]);
