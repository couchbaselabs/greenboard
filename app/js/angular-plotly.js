(function(){
    'use strict';
    angular.module('plotly', [])
        .directive('plotly', ['Data', 'PASS_BAR_STYLE',  'FAIL_BAR_STYLE', 'CHART_LAYOUT', 'CHART_OPTIONS',
            function(Data, PASS_BAR_STYLE, FAIL_BAR_STYLE, CHART_LAYOUT, CHART_OPTIONS) {
                   return {
                       restrict: 'E',
                       template: '<div></div>',
                       scope: {
                        onChange: "="
                       },
                       link: function(scope, element) {
                          var element = element[0].children[0];

                          var build = Data.getBuild()

                          function getDataForBuild(){
                            var passed = PASS_BAR_STYLE
                            var failed = FAIL_BAR_STYLE
                            var filterBy = Data.getBuildFilter()
                            var builds = Data.getVersionBuilds()
                            builds.sort(function(a, b){
                              if(a.build < b.build){
                                return -1
                              }
                              if(a.build > b.build){
                                return 1
                              }
                              return 0
                            })
                            passed.x = failed.x = builds.map(function(b){ return b.build })
                            passed.y = builds.map(function(b){ return b.Passed })
                            failed.y = builds.map(function(b){ return b.Failed })
                            passed.marker = {color: builds.map(function(b){
                                var opacity = '0.40'
                                if(b.build == build){
                                  opacity = '1'
                                }
                                return 'rgba(59, 201, 59, '+opacity+')'
                              })
                            }
                            failed.marker = {color: builds.map(function(b){
                                var opacity = '0.40'
                                if(b.build == build){
                                  opacity = '1'
                                }
                                return 'rgba(222, 0, 0, '+opacity+')'
                              })
                            }
                            return [passed, failed]
                          }

                          var data = getDataForBuild()
                          var options = CHART_OPTIONS;
                          var layout = CHART_LAYOUT;
                          //layout.title = build
                          Plotly.newPlot(element, data, layout, options);

                          $("#builds").bind('plotly_click',
                              function(event,data){
                                  scope.onChange(data.points[0].x)
                          });

                          /*
                          $("#builds").bind('plotly_relayout',
                            function(){
                              Plotly.redraw(element);
                          })*/

                          scope.$watch(function(){ return Data.getBuildFilter() },
                            function(filterBy){
                                getDataForBuild()
                                Plotly.redraw(element);
                            })
                       }
                   };
        }])
      .value('PASS_BAR_STYLE', {x: [], y: [], 
                  type: "bar", name: "Pass"})
      .value('FAIL_BAR_STYLE', {x: [], y: [], 
                  type: "bar", name: "Fail"})
      .value('CHART_LAYOUT', {height: 300, width: 800, margin: {t: 20},
                              title: "", showlegend:false, barmode: 'stack'})
      .value('CHART_OPTIONS', {showLink: false, displayModeBar: false})

})();
