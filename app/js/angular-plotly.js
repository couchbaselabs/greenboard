(function(){
    'use strict';
    angular.module('plotly', [])
        .directive('plotly', ['Data', 'PASS_BAR_STYLE',  'FAIL_BAR_STYLE', 'CHART_LAYOUT', 'CHART_OPTIONS',
            function(Data, PASS_BAR_STYLE, FAIL_BAR_STYLE, CHART_LAYOUT, CHART_OPTIONS) {
                   return {
                       restrict: 'E',
                       template: '<div></div>',
                       scope: {},
                       link: function(scope, element) {
                          var element = element[0].children[0];

                          var versionBuilds = Data.getVersionBuilds()
                          var build = Data.getBuild()

                          var passed = PASS_BAR_STYLE
                          var failed = FAIL_BAR_STYLE
                          var builds = versionBuilds.filter(function(b){ return (b.Passed + b.Failed) > 200})

                          passed.x = failed.x = builds.map(function(b){ return b.build })
                          passed.y = builds.map(function(b){ return b.Passed })
                          failed.y = builds.map(function(b){ return b.Failed })
                          var data = [passed, failed]
                          var options = CHART_OPTIONS;
                          var layout = CHART_LAYOUT;
                          layout.title = Data.getSelectedVersion()+"-"+build
                          Plotly.newPlot(element, data, layout, options);
                           /*
                           scope.$watch(function(){ return Data.getBuild() }, function(build) {

                               if (!build)
                                   return;
                              console.log(build)
                              Plotly.redraw(element);
                           }, true);*/
                       }
                   };
        }])
      .value('PASS_BAR_STYLE', {x: [], y: [], 
                  type: "bar", name: "Pass",
                  marker: {color: 'rgba(59, 201, 59, 0.70)'}})
      .value('FAIL_BAR_STYLE', {x: [], y: [], 
                  type: "bar", name: "Fail",
                  marker: {color: 'rgba(222, 0, 0, 0.70)'}})
      .value('CHART_LAYOUT', {height: 300, width: 800, title: ""})
      .value('CHART_OPTIONS', {showLink: false, displayLogo: false})

})();
