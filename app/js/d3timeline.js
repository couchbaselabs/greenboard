(function(){
    'use strict';
    angular.module('svc.timeline', [])
        .directive('viewTimeline', ['Data', 'Timeline',
          function(Data, Timeline){
              return {
                restrict: 'E',
                scope: {
                   onChange: "=",
                   builds: "="
                },
                link: function(scope, elem, attrs){

                  var builds = scope.builds
                  var id = "#"+elem.attr('id')

                  // Render timeline for version builds
                  // NOTE: onChange callback propagates up to
                  //       build-controller so that view can be
                  //       notified when a build is selected
                  Timeline.init(builds, id, scope.onChange)

                  // re-render if filterBy has changed
                  scope.$watch(function(){ return Data.getBuildFilter() },
                    function(filterBy, lastFilterBy){

                      if((lastFilterBy != undefined) && (filterBy != lastFilterBy)){
                        builds = Data.getVersionBuilds()

                        // update timeline
                        Timeline.update(builds, id)
                      }
                    })

                }
              }

            }])
        .service('Timeline', ['Data', '$timeout',
            function(Data, $timeout) {
              var build
              var _clickBuildCallback;
              var _domId;
              var svg, layer, rect, yScale

              var margin = {top: 40, right: 10, bottom: 100, left: 40},
                  width = 700 - margin.left - margin.right,
                  height = 300 - margin.top - margin.bottom;
              var color = ['rgba(59, 201, 59, 0.5)', 'rgba(222, 0, 0, 0.5)']
              var color_selected = ['rgba(59, 201, 59, 1)', 'rgba(222, 0, 0, 1)']

              function getYMax(layers){
                return d3.max(layers, function(layer) { return d3.max(layer, function(d) { return d.y0 + d.y; }); });
              }

              function getXScale(xLabels){
                return d3.scale.ordinal()
                          .domain(xLabels)
                          .rangeRoundBands([0, width], .08)
              }

              function getYScale(yStackMax){
                return d3.scale.linear()
                        .domain([0, yStackMax])
                        .range([height, 0])
              }

              function getXAxis(xScale){
                var xaxis = d3.svg.axis()
                        .scale(xScale)
                        .tickSize(0)
                        .tickPadding(6)
                        .orient("bottom");

                // down sample tick domain to at least 30 points
                var domain = xScale.domain()
                var skipBy = Math.floor(domain.length/30)
                if(skipBy > 1){
                  var tickValues = domain.filter(function(t, i){ return (i%skipBy) == 0 })
                  xaxis.tickValues(tickValues)
                }

                return xaxis
              }

              function getYAxis(yScale, yStackMax){

                var yaxis = d3.svg.axis()
                        .scale(yScale)
                        .tickSize(0)
                        .tickPadding(6)
                        .orient("left")
                          .tickSize(-width, 0, 0)
                          //.tickFormat("")
                var tickValues = d3.range(yStackMax)
                if(yStackMax > 50){
                  while (tickValues.length >= 10){
                    // shrink until only 5 ticks displayed on yaxis
                    tickValues = tickValues.filter(function(t, i){ return (i%10) == 0 })
                  }
                  if(tickValues.length > 5){
                    tickValues = tickValues.filter(function(t, i){ return (i%2) == 0})
                  }
                } else {
                 tickValues = [yStackMax]
                }
                yaxis.tickValues(tickValues)
                return yaxis
              }
              function scaleWidth(){
                return width + margin.left + margin.right
              }

              function scaleHeight(){
                return height + margin.top + margin.bottom
              }

              function appendSvgToDom(id){
                return d3.select(id).append("svg")
                        .attr("width", scaleWidth())
                        .attr("height", scaleHeight())
                      .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              }

              function appendLayersToSvg(svg, layers){
                // generate g elements from pass fail layer data
                var layer = svg.selectAll(".layer")
                              .data(layers)
                    layer.enter().append("g")
                        .attr("class", "layer")
                return layer
              }

              function appendRectToLayers(x, layer){
                // generate rect elements from pass fail data previously
                // bounded to the 2 layers
                var rect = layer.selectAll("rect")
                        .data(function(d) { return d; })
                      rect.enter().append("rect")
                        .attr("x", function(d) { return x(d.x); })
                        .attr("y", height)
                        .attr("width", x.rangeBand())
                        .attr("height", 0)
                        .style("fill", function(d, i, l) { 
                          return d.x == build ? color_selected[l] : color[l]
                        })

                      // fade out on remove
                      rect.exit().transition()
                        .delay(100)
                        .attr("y", function(d) { return yScale(d.y0); })
                        .attr("height", 0)
                return rect
              }

              function animateRectBarHeight(y, rect){
                // animate showing of rect bars via y-axis
                rect.transition()
                  .delay(function(d, i) { return i * 10; })
                  .attr("y", function(d) { return y(d.y0 + d.y); })
                  .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });               
              }

              function initToolTip(direction, yOffset, xOffset, htmlFun, style){
                return d3.tip()
                      .attr('class', 'd3-tip '+style)
                      .offset([yOffset, xOffset])
                      .direction(direction)
                      .html(htmlFun)
              }

              function configureToolTips(svg, layers, rect){
                // add tool tip to svg 
                var printData = function(d, i) {return d;}
                var tip1 = initToolTip('e', 0, 10, printData, 'd3-tip-pass'),
                    tip2 = initToolTip('e', 0, 10, printData, 'd3-tip-fail'),
                    tip3 = initToolTip('n',-10,0, printData)

                svg.call(tip1); svg.call(tip2); svg.call(tip3)

                // bar callbacks
                rect.on("mouseover", function(d, i){
                  // show tip on pass and fail layer
                  tip1.show(layers[0][i].y, i, rect[0][i])
                  tip2.show(layers[1][i].y, i, rect[1][i])
                  tip3.show(d.x, rect[1][i])
                })
                rect.on("mouseout", function(d, i){
                  // show tip on pass and fail layer
                  tip1.hide(); tip2.hide(); tip3.hide();
                })
              }

              function configureBarClickCallback(rect, clickCallBack){
                // when bar is clicked
                rect.on("click", function(d, i_clicked){

                  // highlight the selected build
                  rect.style("fill", function(d, i, l){
                      return i==i_clicked ? color_selected[l] : color[l]
                    })

                  // and notify consumer of click callback
                  var build = d.x
                  clickCallBack(build)
                })
              }

              function renderSvgXAxis(svg, xAxis){

                // render the xAxis along graph
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis)
                    .selectAll("text") 
                      .style("text-anchor", "end")
                      .attr("dx", "-.8em")
                      .attr("dy", ".15em")
                      .attr("transform", "rotate(-65)" )
              }
              function renderSvgYAxis(svg, yAxis){

                // render the xAxis along graph
                svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(0,0)")
                    .call(yAxis)
              }

              function setHighlightedBuild(buildNames){
                build = Data.getBuild()
                // make sure build is in builds
                if(buildNames.indexOf(build) == -1){
                  build = buildNames[buildNames.length-1]
                }
              }
              function _render(builds){

                    var stack = d3.layout.stack()
                    var xLabels = _.pluck(builds, 'build')
                    var passFailLayers = ['Passed', 'Failed'].map(function(k){
                      return builds.map(function(b, i){ return {x: xLabels[i], y: b[k] }})
                    })
                    var layers = stack(passFailLayers)
                    var yStackMax = getYMax(layers)
                    // convert scales to  d3 axis
                    var xScale = getXScale(xLabels) 
                    var xAxis = getXAxis(xScale)
                    yScale = getYScale(yStackMax)
                    var yAxis = getYAxis(yScale, yStackMax)

                    layer = appendLayersToSvg(svg, layers)
                    rect = appendRectToLayers(xScale, layer)
                    animateRectBarHeight(yScale, rect)

                    // set build to highlight when rendering
                    setHighlightedBuild(xLabels)

                    // configure toolTips behavior
                    configureToolTips(svg, layers, rect)

                    // configure barClick behavior
                    configureBarClickCallback(rect, _clickBuildCallback)

                    // renders x-axis along timeline
                    renderSvgXAxis(svg, xAxis)
                    renderSvgYAxis(svg, yAxis)

              }
              return {


                init:  function(builds, id, clickCallBack){

                    // init timeline svg
                    svg = appendSvgToDom(id)

                    // remember domId and click callback for future updates
                    _domId = id
                    _clickBuildCallback = clickCallBack

                    // render
                    _render(builds)

                  
                  },
                update: function(builds){

                    // fade timeline
                    rect.transition()
                      .delay(100)
                      .attr("y", function(d) { return yScale(d.y0); })
                      .attr("height", 0);

                    // fade out xaxis ticks
                    svg.selectAll('.tick text')
                      .transition().delay(10)
                      .style("fill", "white")

                    // after fading out view...
                    $timeout(function(){
                        // remove x axis from dom
                        svg.select(".x").remove()
                        // remove bars from dom
                        layer.remove()
                        // re-render timeline
                        _render(builds)
                    }, 250)

                  }


              }
        }])
})();
