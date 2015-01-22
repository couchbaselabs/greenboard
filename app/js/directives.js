var app = angular.module('greenboardDirectives', []);

app.directive("pieChart", pieChartDirective);
app.directive("barChart", ['Data', '$location', barChartDirective]);
