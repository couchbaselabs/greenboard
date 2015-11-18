'usev strict'
var app = angular.module('greenBoard', [
  'ui.router',
  'svc.data',
  'svc.view',
  'svc.query',
  'ctl.main',
  'ctl.version',
  'ctl.timeline',
  'ctl.initdata',
  'ctl.sidebar',
  'ctl.jobs'
]);


app.config(['$stateProvider', '$urlRouterProvider',
  function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("/server/latest");

    $stateProvider
      .state('target', {
        url: "/:target",
        views: {
          "sidebar": {
            templateUrl: "partials/sidebar.html",
            controller: "SidebarCtrl",
          },
          "main": {
            templateUrl: "view.html",
            controller: "MainCtrl"
          }
        },
        resolve: {
          versions: ['QueryService', '$stateParams', function(QueryService, $stateParams){
            var target = $stateParams.target
            return QueryService.getVersions(target)
          }]
        }
      })
      .state('target.version', {  
        // 
        // if version is latest get Highest Version no.
        // get all builds for selected version
        // make timeline of builds based on version
        url: "/:version",
        controller: 'VersionCtrl',
        resolve: {
          selectedVersion: ['$stateParams', 'versions', function($stateParams, versions){
            var version = $stateParams.version
            if(version == 'latest'){
              version = versions[versions.length-1]
            }
            return version
          }]
        }

      })
      /*
      .state('target.version.build', {  
        // if build is latest get Highest build no
        // jobs for build based on version
        url: "/:build_id",
        templateUrl: "partials/jobs.html",
        controller: "JobsCtrl",
        resolve:{
          jobs: ['versions', function(versions){
            console.log("jobs breakdown", versions)
            return true
          }]
        }
      })*/

  }]);


// build state is templateless with child siblings (jobs/sidebar)
// they each take in target/version/build service to setup data for their views


// d3.legend.js 
// (C) 2012 ziggy.jonsson.nyc@gmail.com
// MIT licence

(function() {
d3.legend = function(g) {
  g.each(function() {
    var g= d3.select(this),
        items = {},
        svg = d3.select(g.property("nearestViewportElement")),
        legendPadding = g.attr("data-style-padding") || 5,
        lb = g.selectAll(".legend-box").data([true]),
        li = g.selectAll(".legend-items").data([true])

    lb.enter().append("rect").classed("legend-box",true)
    li.enter().append("g").classed("legend-items",true)

    svg.selectAll("[data-legend]").each(function() {
        var self = d3.select(this)
        items[self.attr("data-legend")] = {
          pos : self.attr("data-legend-pos") || this.getBBox().y,
          color : self.attr("data-legend-color") != undefined ? self.attr("data-legend-color") : self.style("fill") != 'none' ? self.style("fill") : self.style("stroke") 
        }
      })

    items = d3.entries(items).sort(function(a,b) { return a.value.pos-b.value.pos})

    
    li.selectAll("text")
        .data(items,function(d) { return d.key})
        .call(function(d) { d.enter().append("text")})
        .call(function(d) { d.exit().remove()})
        .attr("y",function(d,i) { return i+"em"})
        .attr("x","1em")
        .text(function(d) { ;return d.key})
    
    li.selectAll("circle")
        .data(items,function(d) { return d.key})
        .call(function(d) { d.enter().append("circle")})
        .call(function(d) { d.exit().remove()})
        .attr("cy",function(d,i) { return i-0.25+"em"})
        .attr("cx",0)
        .attr("r","0.4em")
        .style("fill",function(d) {return d.value.color})  
    
    // Reposition and resize the box
    var lbbox = li[0][0].getBBox()  
    lb.attr("x",(lbbox.x-legendPadding))
        .attr("y",(lbbox.y-legendPadding))
        .attr("height",(lbbox.height+2*legendPadding))
        .attr("width",(lbbox.width+2*legendPadding))
  })
  return g
}
})()

// d3.tip
// Copyright (c) 2013 Justin Palmer
//
// Tooltips for d3.js SVG visualizations

// Public - contructs a new tooltip
//
// Returns a tip
d3.tip = function() {
  var direction = d3_tip_direction,
      offset    = d3_tip_offset,
      html      = d3_tip_html,
      node      = initNode(),
      svg       = null,
      point     = null,
      target    = null

  function tip(vis) {
    svg = getSVGNode(vis)
    point = svg.createSVGPoint()
    document.body.appendChild(node)
  }

  // Public - show the tooltip on the screen
  //
  // Returns a tip
  tip.show = function() {
    var args = Array.prototype.slice.call(arguments)
    if(args[args.length - 1] instanceof SVGElement) target = args.pop()

    var content = html.apply(this, args),
        poffset = offset.apply(this, args),
        dir     = direction.apply(this, args),
        nodel   = d3.select(node), i = 0,
        coords

    nodel.html(content)
      .style({ opacity: 1, 'pointer-events': 'all' })

    while(i--) nodel.classed(directions[i], false)
    coords = direction_callbacks.get(dir).apply(this)
    nodel.classed(dir, true).style({
      top: (coords.top +  poffset[0]) + 'px',
      left: (coords.left + poffset[1]) + 'px'
    })

    return tip
  }

  // Public - hide the tooltip
  //
  // Returns a tip
  tip.hide = function() {
    nodel = d3.select(node)
    nodel.style({ opacity: 0, 'pointer-events': 'none' })
    return tip
  }

  // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
  //
  // n - name of the attribute
  // v - value of the attribute
  //
  // Returns tip or attribute value
  tip.attr = function(n, v) {
    if (arguments.length < 2 && typeof n === 'string') {
      return d3.select(node).attr(n)
    } else {
      var args =  Array.prototype.slice.call(arguments)
      d3.selection.prototype.attr.apply(d3.select(node), args)
    }

    return tip
  }

  // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
  //
  // n - name of the property
  // v - value of the property
  //
  // Returns tip or style property value
  tip.style = function(n, v) {
    if (arguments.length < 2 && typeof n === 'string') {
      return d3.select(node).style(n)
    } else {
      var args =  Array.prototype.slice.call(arguments)
      d3.selection.prototype.style.apply(d3.select(node), args)
    }

    return tip
  }

  // Public: Set or get the direction of the tooltip
  //
  // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
  //     sw(southwest), ne(northeast) or se(southeast)
  //
  // Returns tip or direction
  tip.direction = function(v) {
    if (!arguments.length) return direction
    direction = v == null ? v : d3.functor(v)

    return tip
  }

  // Public: Sets or gets the offset of the tip
  //
  // v - Array of [x, y] offset
  //
  // Returns offset or
  tip.offset = function(v) {
    if (!arguments.length) return offset
    offset = v == null ? v : d3.functor(v)

    return tip
  }

  // Public: sets or gets the html value of the tooltip
  //
  // v - String value of the tip
  //
  // Returns html value or tip
  tip.html = function(v) {
    if (!arguments.length) return html
    html = v == null ? v : d3.functor(v)

    return tip
  }

  function d3_tip_direction() { return 'n' }
  function d3_tip_offset() { return [0, 0] }
  function d3_tip_html() { return ' ' }

  var direction_callbacks = d3.map({
    n:  direction_n,
    s:  direction_s,
    e:  direction_e,
    w:  direction_w,
    nw: direction_nw,
    ne: direction_ne,
    sw: direction_sw,
    se: direction_se
  }),

  directions = direction_callbacks.keys()

  function direction_n() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.n.y - node.offsetHeight,
      left: bbox.n.x - node.offsetWidth / 2
    }
  }

  function direction_s() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.s.y,
      left: bbox.s.x - node.offsetWidth / 2
    }
  }

  function direction_e() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.e.y - node.offsetHeight / 2,
      left: bbox.e.x
    }
  }

  function direction_w() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.w.y - node.offsetHeight / 2,
      left: bbox.w.x - node.offsetWidth
    }
  }

  function direction_nw() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.nw.y - node.offsetHeight,
      left: bbox.nw.x - node.offsetWidth
    }
  }

  function direction_ne() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.ne.y - node.offsetHeight,
      left: bbox.ne.x
    }
  }

  function direction_sw() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.sw.y,
      left: bbox.sw.x - node.offsetWidth
    }
  }

  function direction_se() {
    var bbox = getScreenBBox()
    return {
      top:  bbox.se.y,
      left: bbox.e.x
    }
  }

  function initNode() {
    var node = d3.select(document.createElement('div'))
    node.style({
      position: 'absolute',
      opacity: 0,
      pointerEvents: 'none',
      boxSizing: 'border-box'
    })

    return node.node()
  }

  function getSVGNode(el) {
    el = el.node()
    if(el.tagName.toLowerCase() == 'svg')
      return el

    return el.ownerSVGElement
  }

  // Private - gets the screen coordinates of a shape
  //
  // Given a shape on the screen, will return an SVGPoint for the directions
  // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
  // sw(southwest).
  //
  //    +-+-+
  //    |   |
  //    +   +
  //    |   |
  //    +-+-+
  //
  // Returns an Object {n, s, e, w, nw, sw, ne, se}
  function getScreenBBox() {
    var targetel   = target || d3.event.target,
        bbox       = {},
        matrix     = targetel.getScreenCTM(),
        tbbox      = targetel.getBBox(),
        width      = tbbox.width,
        height     = tbbox.height,
        x          = tbbox.x,
        y          = tbbox.y,
        scrollTop  = document.documentElement.scrollTop || document.body.scrollTop,
        scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft


    point.x = x + scrollLeft
    point.y = y + scrollTop
    bbox.nw = point.matrixTransform(matrix)
    point.x += width
    bbox.ne = point.matrixTransform(matrix)
    point.y += height
    bbox.se = point.matrixTransform(matrix)
    point.x -= width
    bbox.sw = point.matrixTransform(matrix)
    point.y -= height / 2
    bbox.w  = point.matrixTransform(matrix)
    point.x += width
    bbox.e = point.matrixTransform(matrix)
    point.x -= width / 2
    point.y -= height / 2
    bbox.n = point.matrixTransform(matrix)
    point.y += height
    bbox.s = point.matrixTransform(matrix)

    return bbox
  }

  return tip
};

angular.module('dir.d3', [])

.directive("barChart", ['Data', '$location',
    function (Data, $location){

   var margin = {top: 50, right: 10, bottom: 150, left: 50},
       margin2 = {top: 150, right: 10, bottom: 20, left: 50},
       width = 860 - margin.left - margin.right,
       height = 270 - margin.top - margin.bottom,
       height2 = 270 - margin2.top - margin2.bottom;

    var selectedIndex = 0;

    function loadTimeline(scope, data, el){

            var passed = data[0].values;
            var failed = data[1].values;
            var selectedIndex =
                Data.versionBuilds.indexOf(Data.selectedBuildObj);

            var rangeCursor = 0;
            var n = 2;
            var m = passed.length;
            var t = 30; // truncation value
            stack = d3.layout.stack();
            var colors = ["#3bc93b", "#de0000"];

            layers = function(pass, fail){
                return [
                    { "name": "passed",
                      "x" : 0,
                      "values": pass.map(function(d, i){
                         return {"x": i,
                                 "y": d[1],
                                 "y0": 0,
                                 "bno": d[0],
                                 "cc": colors[0]}})
                    },
                    { "name": "failed",
                      "x" : 0,
                      "values": fail.map(function(d, i){
                         return {"x": i,
                                 "y": -1*d[1],
                                 "y0": 0,
                                 "bno": d[0],
                                 "cc": colors[1]}})
                    }
                ]};

            yGroupMax = d3.max(passed, function(d) { return d[1]; });


            var x = d3.scale.ordinal()
                    .domain(passed.map(function(d){ return d[0]}))
                    .rangeRoundBands([0, width], .08),
                x2 = d3.scale.ordinal()
                    .domain(passed.map(function(d){ return d[0]}))
                    .rangeRoundBands([0, width], .08),
                y = d3.scale.linear()
                    .domain([0, yGroupMax])
                    .range([height, 0]),
                y2 = d3.scale.linear()
                    .domain([0, yGroupMax])
                    .range([height2, 0]);

            var barWidth = Math.floor(width/x2.domain().length);

            var svg = d3.select(el).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + 150);

            svg.append("defs").append("clipPath")
                .attr("id", "clip")
              .append("rect")
                .attr("width", width)
                .attr("height", width);

            var focus = svg.append("g")
                .attr("class", "focus")
                .attr("transform",
                     "translate("+ margin.left +"," + margin.top + ")");

            var context = svg.append("g")
                .attr("class", "context")
                .attr("transform",
                    "translate(" + margin2.left + "," + margin2.top + ")");


            var xTickerValues = function(pass){
                var tickerMod = 1;
                if(pass.length > 10){
                    tickerMod = Math.floor(m/10);
                }

                return pass.filter(function(d, i){
                          return (i%tickerMod == 0) }).map(function(d){
                                return d[0]});
            }
            var xAxis = d3.svg.axis()
                .scale(x)
                .tickValues(xTickerValues(passed))
                .tickSize(0)
                .tickPadding(6)
                .orient("bottom");

            var xAxis2 = d3.svg.axis()
                .scale(x2)
                .tickFormat("")
                .tickSize(0)
                .tickPadding(6)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .tickSize(-width, 0, 0)
                .tickPadding(6)
                .orient("left")
                .ticks(3);

            var opaqueLevel = function(d){
                var selectedBno =
                    Data.selectedBuildObj.Version.split("-")[1];
                if (selectedBno == d.bno){
                    return 1;
                }
                return 0.5;
            };

            var layer = focus.selectAll(".layer")
                .data(layers(passed, failed));

            layer.enter().append("g")
                .attr("class", "layer")
                .style("fill", function(d, i) { return colors[i]; })
                .attr("data-legend",function(d) { return d.name});

            var legend = svg.append("g")
                .attr("class","legend")
                .attr("transform","translate("+width+", 20)")
                .style("font-size","12px")
                .call(d3.legend);

            var tip = d3.tip()
              .attr('class', 'd3-tip')
              .offset([-10, 0])
              .html(function(d, i) {
                  var p = passed[i][1];
                  var f = -1*failed[i][1];
                return "<div class='tip'><h4>passed: "+p+" failed: "+f+"</h4><strong>"+d.bno+"</strong></div>";
                });
            focus.call(tip);

            var rect = layer.selectAll("rect")
                .data(function(d) {return d.values;})
              .enter().append("rect")
                .attr("class", "bar")
                .style("fill", function(d, i) { return d.cc; })
                .attr("x", function(d, i) {return x(d.bno)})
                .attr("y", function(d) { return y(d.y); })
                .style("opacity", opaqueLevel)
                .attr("width", x.rangeBand())
                .attr("height", function(d) {
                     return y(d.y0) - y(d.y0 + d.y); })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);

            // context layer with brush
            var brush = d3.svg.brush()
                .x(x2)
                .extent([width/4, width])
                .on("brush", function(){
                    // convert brush extent from pixel space
                    var extents = brush.extent();
                    var lval = Math.floor(extents[0]/barWidth);
                    var rval = Math.floor(extents[1]/barWidth);
                    var nPass = passed.filter(function(d, i){
                                return((i>=lval) && (i<=rval))});
                    var nDom = nPass.map(function(d){ return d[0] });
                    if(nDom.length > 0){

                        // update focus domain
                        x.domain(nDom);

                        // update focus data
                        rect.data(function(d) {return d.values;})
                            .attr("x", function(d, i) {return x(d.bno)})
                            .attr("height", function(d,i){
                                if((i<lval) || (i>rval)){
                                    return 0;
                                } return y(d.y0) - y(d.y); })
                            .attr("width", x.rangeBand());

                        // redraw axis
                        xAxis.tickValues(xTickerValues(nPass));
                        focus.select(".x.axis").call(xAxis);
                    }
                });

            var cxlayer = context.selectAll(".layer2")
                .data(layers(passed, failed))
              .enter().append("g")
                .attr("class", "layer2");

            var cxrect = cxlayer.selectAll("rect")
                .data(function(d) {return d.values;})
              .enter().append("rect")
                .attr("x", function(d, i) {return x(d.bno)})
                .attr("y", function(d, i) {return y(d.y)/4})
                .style("fill", function(d, i) { return d.cc; })
                .style("opacity", opaqueLevel)
                .attr("width", x.rangeBand())
                .attr("height", function(d) {
                     return (y(d.y0) - y(d.y0 + d.y))/4; });

            var cxlayer = context.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height2 + ")")
              .call(xAxis2);

            cxlayer.append("g")
              .attr("class", "x brush")
              .call(brush)
              .call(brush.event)
            .selectAll("rect")
              .attr("y", -1*(height2+10))
              .attr("height", 30);


            rect.on("click", function(event, i) {
                Data.selectedBuildObj = Data.versionBuilds[i];
                $location.search("build", Data.selectedBuildObj.Version);
                $location.search("excluded_platforms", null);
                $location.search("excluded_categories", null);
                Data.refreshSidebar = true;
                Data.refreshJobs = true;

                // set opacity
                rect.transition()
                    .delay(1)
                    .style("opacity", opaqueLevel);

                cxrect.transition()
                    .delay(1)
                    .style("opacity", opaqueLevel);
                scope.$apply();
            });


            focus.append("g")
                .attr("class", "x axis grid")
                .attr("transform", "translate(0,"+height+")")
                .call(xAxis);

            focus.append("g")
                .attr("class", "y axis grid")
                .attr("transform", "translate(10,0)")
                .call(yAxis);


    }

    function link(scope, element, attr){
         scope.$watch('buildData', function(d){
            console.log(d)
         })
        scope.$watch('data.timelineAbsData', function(data){
            if((data != undefined) && (data.length > 0)){
                d3.select(element[0]).select("svg").remove();
                loadTimeline(scope, data, element[0]);
            }
        }, true);
    }

    return {
        link: link,
        restrict: 'E',
        scope: {
            buildData: '=builds'
        }
    }
}])

.directive("pieChart", [function(){

    function link(scope, element, attr){
        var color = d3.scale.category10();
        var data = [10, 20, 30];
        var width = 150;
        var height = 150;
        var min = Math.min(width, height);
        var svg = d3.select(element[0]).append('svg');
        var pie = d3.layout.pie().sort(null);
        var arc = d3.svg.arc()
            .outerRadius(min / 2 * 0.9)
            .innerRadius(min / 2 * 0.5);

        svg.attr({width: width, height: height});
        var g = svg.append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        g.selectAll('path').data(pie(data))
            .enter().append('path')
            .style('stroke', 'white')
            .attr('d', arc)
            .attr('fill', function(d, i){ return color(i) });
    }

    return {
        link: link,
        restrict: 'E',
        scope: false,
    }
}])



angular.module('svc.data', [])
.provider('Data', [function (){
    this.versions = [];
    this.bucket = "server";
    this.selectedVersion = null;
    this.versionBuilds = [];
    this.selectedBuildObj = null;
    this.timelineAbsData = [];
    this.timelineRelData = [];
    this.refreshSidebar = false;
    this.refreshTimeline = false;
    this.refreshJobs = false;    

    this.$get = function(){
        return {
            setBucket: function(bucket){
                this.bucket = bucket
            },



            findBuildObj: function(build){
                var _build = this.versionBuilds.filter(function(b){
                    if(b.Version == build){
                        return true;
                    }
                });
                var rc;
                if (_build.length == 0){
                    rc = this.lastVersionBuild();
                } else {
                    rc = _build[0];
                }
                return rc;
            },
            bucket: "server",
            lastVersionBuild: function(){
                return lastEl(this.versionBuilds);
            },
            knownPlatforms: [],
            knownCategories: []
        }
    }
}])


function lastEl(a){
  if(a.length > 0) {
    return a[a.length -1];
  } else {
    return a[0];
  }
}

angular.module('ctl.initdata', [])

.controller('InitDataCtrl', ['$scope', 'ViewService', 'Data', '$location',
  function ($scope, ViewService, Data, $location){


  var selectedVersion = null;
  var selectedBuildObj = null;
  var urlArgs = $location.search();
  function initFilters(){

    $scope.filterMenues = [{
        "title": "Total Passed",
        "key": "abspassed",
        "value": 200,
        "options": [0, 100, 200, 500],
        "i": 0
      }, {
        "title": "Total Failed",
        "key": "absfailed",
        "value": 25,
        "options": [0, 10, 25, 50],
        "i": 1
      }, {
        "title": "Perc. Passed",
        "key": "percpassed",
        "value": 50,
        "options": [0, 25, 50, 75],
        "i": 2
      }, {
        "title": "Perc. Failed",
        "key": "percfailed",
        "value": 25,
        "options": [0, 10, 25, 50],
        "i": 3
      }
    ];

    // filters
    $scope.filterBy = $scope.filterMenues[0];
  }

  // pull version and build from urlArgs
  if ("version" in urlArgs){
    selectedVersion = urlArgs.version;
  }



  // next version selector
  var nextVersion = function(version){
      var next;
      var idx = Data.versions.indexOf(version);
      if ((idx > -1) && (idx < (Data.versions.length - 1))){
          next = Data.versions[idx + 1];
      }
      return next;
  }

  initFilters();

  // pull filter values from urlArgs
  if (("fi" in urlArgs) && ("fv" in urlArgs)){
    $scope.filterBy = $scope.filterMenues[urlArgs.fi];
    $scope.filterBy.value = urlArgs.fv;
  }

  // set target
  /*if ("ft" in urlArgs) {
      $scope.targetBy = $scope.viewTargets[urlArgs.ft];
      Data.bucket = $scope.targetBy.bucket;
  }*/

  // init controller data
  var selectVersion = function(){
      return ViewService.versions().then(function(versions){
        Data.versions = versions;
      //  $scope.pagerVersions = versions;
        if (selectedVersion){
          Data.selectedVersion = selectedVersion;
        } else { // not showing latest latest by default
          Data.selectedVersion = versions[versions.length - 2];
        }

        $scope.selectedVersion = Data.selectedVersion;
      });
  };

  var initVersionBuild = function(){

    // get builds for version
    var filterBy = $scope.filterBy;
    var selectedVersion = Data.selectedVersion;
  //  var endVersion = nextVersion(selectedVersion);
    return ViewService.timeline(selectedVersion, filterBy).then(function(response){

      if (response.allBuilds.length > 0 && response.versionBuilds.length == 0){

          // try a lower filter when data exists but is being excluded
          var options = $scope.filterBy.options;
          var filterIdx = options.indexOf($scope.filterBy.value);
          if (filterIdx > 0){
            $scope.filterBy.value = options[filterIdx - 1];
            $location.search("fv", $scope.filterBy.value);
            return initVersionBuild(); // re-init
          }
      }

      Data.timelineAbsData = response.absData;
      Data.timelineRelData = response.relData;
      Data.versionBuilds = response.versionBuilds;
      if ("build" in urlArgs){
        Data.selectedBuildObj = Data.findBuildObj(urlArgs.build);
      } else {
        Data.selectedBuildObj = Data.lastVersionBuild();
      }
    });
  };

  var clearLocations = function(){
    $location.search("fi", null);
    $location.search("fv", null);
    $location.search("ft", null);
    $location.search("version", null);
    $location.search("build", null);
    $location.search("excluded_platforms", null);
    $location.search("excluded_categories", null);
    urlArgs = {};
  }

  var updateLocations = function(){
    $location.search("version", Data.selectedVersion);
    $location.search("build", Data.selectedBuildObj.Version);
    $location.search("fi", $scope.filterBy.i);
    $location.search("fv", $scope.filterBy.value);
    $location.search("ft", $scope.targetBy.i);
  }


  var initData = function(){
    initVersionBuild()
        .then(function(){
            updateLocations();
            Data.refreshSidebar = true;
            Data.refreshTimeline = true;
            Data.refreshJobs = true;
        });
  }

  var clearPlatformCategories = function(){
      $location.search("excluded_platforms", null);
      $location.search("excluded_categories", null);
  }

  // pagination controls
  $scope.didSelectVersion = function(version){ // ie 3.0, 3.5
      clearLocations();
      _b = Data.bucket;
      Data.bucket = _b;
      clearPlatformCategories();
      Data.selectedVersion = version;
      $scope.selectedVersion = version;
      initData();
  };
  $scope.didSelectFilter = function(value){  // ie 0 50 100
    // change filter.by value  and update timeline
    $scope.filterBy.value = value;
    clearPlatformCategories();
    initData();

  };
  $scope.didSelectMenu = function(menu){ // ie abs, perc pass failed
    // change filter.by menu and update timeline
    $scope.filterBy = menu;
    initData();
  };

  $scope.didSelectTarget = function(target){ // ie couchbase, mobile, sdk
    clearLocations();
    $scope.targetBy = target;
    Data.bucket = target.bucket;
    main();
  };

  // main
  function main(){
      // load known platforms and categories
      ViewService.categories().then(function(response){
          Data.knownPlatforms = response.data.platforms;
          Data.knownCategories = response.data.components;
      });
      selectVersion()
        .then(initData);
  }

  main();
}])



angular.module('ctl.jobs', [])
.controller('JobsCtrl', ['$scope', 'ViewService', 'Data', '$location',

  function ($scope, ViewService, Data, $location){

    $scope.data = Data;
    $scope.jobsPending = 0;
    $scope.jobsCompleted = 0;
    $scope.$watch('data.refreshJobs', function(newVal, oldVal){

        // update timeline when data has been updated
        if (newVal  == true){
            displayJobs();
            Data.refreshJobs = false;
        }

    });

    $scope.nameSort = function(el){
        return el.name;
    };

    $scope.predicate = $scope.nameSort;

    function displayJobs(){
      if($scope.runningJobs){ return; } // already running

      $scope.runningJobs = true;
      var build = Data.selectedBuildObj.Version;
      $scope.jobs = [];
      $scope.missingJobs = [];
      var dupeChecker = {};
      $scope.testsPassed = 0;
      $scope.testsTotal = 0;

      var pushToJobScope = function(response, ctx, isMissingScope){
            response.forEach(function(job){
                if (job.Bid == -1){
                  job.Bid = "";
                }
                // no double reporting
                if (job.Name in dupeChecker){
                    return;
                }
                if(job.Url.indexOf("macbuild") > -1){
                   job.Url = "https://macbuild.hq.couchbase.com/"
                   job.Bid = "" 
                }

                dupeChecker[job.Name] = true;

                ctx.push({
                   "name": job.Name,
                   "passed": job.Passed,
                   "total": job.Total,
                   "result": job.Result,
                   "priority": job.Priority,
                   "url": job.Url,
                   "bid": job.Bid,
                   "duration": msToTime(job.Duration),
                   "claim": job.Claim
                });
                if(isMissingScope){
                    $scope.testsPending += job.Total;
                } else {
                    $scope.testsPassed += job.Passed;
                    $scope.testsTotal += job.Total;
                }
            });
      }

      var urlArgs = $location.search();
      var platforms = [];
      var categories = [];
      if ("excluded_platforms" in urlArgs){
        platforms = urlArgs.excluded_platforms.split(",");
      }
      if ("excluded_categories" in urlArgs){
        categories = urlArgs.excluded_categories.split(",")
      }

      ViewService.jobs(build, platforms, categories).then(function(response){
        // bid sort
        response.sort(function(a, b){
          if(a.Bid && b.Bid) {
            if(a.Bid > b.Bid){ return -1}
            if(a.Bid < b.Bid){ return 1}
          }
          return 0;
        })

        pushToJobScope(response, $scope.jobs, false);



        $scope.jobsCompleted = $scope.jobs.length;

          ViewService.jobs_missing(build, platforms, categories).then(function(response){
            $scope.testsPending = 0;
            pushToJobScope(response, $scope.missingJobs, true);
            $scope.jobsPending = $scope.missingJobs.length;
            $scope.runningJobs = false;
          });
      });

    }

}])

// https://coderwall.com/p/wkdefg/converting-milliseconds-to-hh-mm-ss-mmm
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

angular.module('ctl.main', ['svc.targets'])

  .controller('MainCtrl', ['$scope', '$location', '$stateParams', 'ViewTargets', 'Data', 'versions',
	function($scope, $location, $stateParams, ViewTargets, Data, versions){
		var urlTarget = $stateParams.target
		$scope.targetBy = ViewTargets.getTarget(urlTarget)
		ViewTargets.setTarget(urlTarget)

		// setup initial view targets
		$scope.viewTargets = ViewTargets.allTargets()
		$scope.pagerVersions = versions

		
		Data.setBucket(urlTarget)

  }])
angular.module('svc.query', [])
	.service("QueryService",['$http', 'Data',
		function($http, Data){
		  return {
			getVersions: function(target){
				var url = ["versions", target].join("/")
		        return $http({"url": url, cache: true})
		        			.then(function(response){
		        				return response.data
		        			})
			},
			getBuilds: function(target, version){
				var url = ["builds", target, version].join("/")
		        return $http({"url": url, cache: true})
		        			.then(function(response){
		        				return response.data
		        			})				
			}
		  }
		}])

angular.module('ctl.sidebar', [])

.controller('SidebarCtrl', ['$scope', 'ViewService', 'Data', '$location',
  function ($scope, ViewService, Data, $location){

    // bind scope to data factory
    $scope.data = Data;

    // local scope bindings
    $scope.showAsPerc = true;
    $scope.showAllPlatforms = true;
    $scope.showAllCategories = true;
    $scope.PlatformsList = [];
    $scope.CategoriesList = [];
    $scope.didFirstSort = false;

    $scope.orderByPerc = function(el){

        // if already sorted by perc use old order 
        if ($scope.didFirstSort){
            return el.sortOrder;
        }   
        el.sortOrder = $scope.getPerc(el)*-100;
       return el.sortOrder;

    };

    $scope.objAsList = function(obj){
        var li = []; 
        for (var key in obj) {
            li.push(obj[key]);
        }
        return li;       
    };

    var resetSidebar = function() {
        $scope.selectedVersion = Data.selectedVersion;
        $scope.build = Data.selectedBuildObj;
        $scope.build.Passed = 0;
        $scope.build.Failed = 0;
        $scope.build.Pending = 0;
        $scope.showAllPlatforms = true;
        $scope.showAllCategories = true;

        if(Data.selectedBuildObj){
            $scope.Platforms = {};
            $scope.Categories = {};

            queryBreakdown().then(function(){

                var urlArgs = $location.search();
                var needsRefresh = false;
                if ("excluded_platforms" in urlArgs){
                  needsRefresh = true;
                  var platforms = urlArgs.excluded_platforms.split(",");
                  platforms.forEach(function(p){
                    _toggleItem({'Platform': p}, 'p');
                  });
                }
                if ("excluded_categories" in urlArgs){
                  needsRefresh = true;
                  var categories = urlArgs.excluded_categories.split(",")
                  categories.forEach(function(c){
                    _toggleItem({'Category': c}, 'c');
                  });
                }

                if (needsRefresh) {
                    updateBreakdown();
                }
            });
        }
    }

    $scope.$watch('data.refreshSidebar', function(newVal, oldVal){

        // update scope when data has been updated
        if (newVal == true){
          // build is same
          resetSidebar();
          Data.refreshSidebar = false;
        } else {
            // resort for new build
            $scope.didFirstSort = false;
        }

    });

    // handle % vs # slidler action
    $scope.didClickSlider = function(){
      $scope.showAsPerc = !$scope.showAsPerc;
    }

    $scope.getPercVal = function(item, val){
      if (!item){
        return 0;
      }

      var denom = item.Passed + item.Failed;
      if(denom == 0){ return 0; }
      return 100*(val/denom);
    }

    $scope.getPerc = function(item){
      if (!item){
        return 0;
      }

      var total = item.Passed + item.Failed;
      var denom = total + item.Pending;
      if(denom == 0){ return 0; }

      return total/denom;
    }

    var updateTotals = function (build){
        $scope.Categories[build.Category].Passed += build.Passed;
        $scope.Categories[build.Category].Failed += build.Failed;
        $scope.Categories[build.Category].Pending += build.Pending;
        $scope.Platforms[build.Platform].Passed += build.Passed;
        $scope.Platforms[build.Platform].Failed += build.Failed;
        $scope.Platforms[build.Platform].Pending += build.Pending;
        $scope.build.Passed += build.Passed;
        $scope.build.Failed += build.Failed;
        $scope.build.Pending += build.Pending;
    }

    var updateStatuses = function (build){
        
        var success = "bg-success";
        var warning = "bg-warning";
        var danger = "bg-danger";

        if ($scope.Platforms[build.Platform].Status != "greyed") {
            var fAbs = $scope.Platforms[build.Platform].Failed;
            if (fAbs > 0){
              var pAbs = $scope.Platforms[build.Platform].Passed;
              var fRel = 100.0*fAbs/(fAbs + pAbs);
             if (fRel > 30){
                   $scope.Platforms[build.Platform].Status = danger;
		          } else {
                   $scope.Platforms[build.Platform].Status = warning;
              }
            } else {
                $scope.Platforms[build.Platform].Status = success;
            }
        }

        if (($scope.Platforms[build.Platform].Passed == 0) &&
                ($scope.Platforms[build.Platform].Failed == 0)) {
            // did not run
             $scope.Platforms[build.Platform].Status = "disabled";
        }

        if ($scope.Categories[build.Category].Status != "greyed") {
          var fAbs = $scope.Categories[build.Category].Failed;
            if (fAbs > 0){
              var pAbs = $scope.Categories[build.Category].Passed;
              var fRel = 100.0*fAbs/(fAbs + pAbs);
              if (fRel > 30){
                     $scope.Categories[build.Category].Status = danger;
              } else {
                     $scope.Categories[build.Category].Status = warning;
              }
            } else {
                $scope.Categories[build.Category].Status = success;
            }
        }

        if (($scope.Categories[build.Category].Passed == 0) &&
                ($scope.Categories[build.Category].Failed == 0)) {
             $scope.Categories[build.Category].Status = "disabled";
        }

        var fAbs = $scope.build.Failed;
        if (fAbs == 0){
          $scope.build.Status = success;
        } else {
            var pAbs = $scope.build.Passed;
            var fRel = 100.0*fAbs/(fAbs + pAbs);
          if (fRel > 30){
            $scope.build.Status = danger;
          } else {
            $scope.build.Status = warning;
          }
        }
    }

    var queryBreakdown = function(platforms, categories){

      return ViewService.breakdown(Data.selectedBuildObj.Version, platforms, categories).then(function(response){

        // update totals for each platform and category
        response.forEach(function(build) {
          
          // add in new categories
          if (!(build.Category in $scope.Categories)) {
              $scope.Categories[build.Category] = {
                  "Category": build.Category,
                  "Passed": 0,
                  "Failed": 0,
                  "Pending": 0,
                  "Status": "bg-success",
                  "checked": true,
              };
          }
          if (!(build.Platform in $scope.Platforms)){
              $scope.Platforms[build.Platform] = {
                  "Platform": build.Platform,
                  "Passed": 0,
                  "Failed": 0,
                  "Pending": 0,
                  "Status": "bg-success",
                  "checked": true,
              };
          }

          // totals
          updateTotals(build);

          // status bars
          updateStatuses(build);

        });

      });
    }

    var updateBreakdown = function(){

      // update url
      var selectedBuild = Data.selectedBuildObj.Version;
      $scope.build.Passed = 0;
      $scope.build.Failed = 0;
      $scope.build.Pending = 0;
      $scope.build.Status = "bg-success";

      var platforms = [];
      var categories = [];

      Object.keys($scope.Categories).forEach(function(k){

        var item = $scope.Categories[k];
        item.Passed = 0;
        item.Failed = 0;
        item.Pending = 0;
        if (item.Status == "greyed"){
          if (categories.indexOf(k) < 0){
              categories.push(k);
          }
        } else {
          item.Status = "disabled";
        }
      });
      Object.keys($scope.Platforms).forEach(function(k){
        var item = $scope.Platforms[k];
        item.Passed = 0;
        item.Failed = 0;
        item.Pending = 0;
        if (item.Status == "greyed"){
          if (platforms.indexOf(k) < 0){
              platforms.push(k);
          }
        } else {
          item.Status = "disabled";
        }
      });

      // if all platforms|categories excluded toggle showAll flags
      if (platforms.length > 0 &&
          (platforms.length == Object.keys($scope.Platforms).length)){
        $scope.showAllPlatforms = false;
      } else if(platforms.length == 0){ // exclude none
        $scope.showAllPlatforms = true;
      }

      if (categories.length > 0 &&
          (categories.length  == Object.keys($scope.Categories).length)){
        $scope.showAllCategories = false;
      } else if(categories.length == 0){
        $scope.showAllCategories = true;
      }

      var platformParam = null;
      var categoryParam = null;
      if (platforms.length > 0){
        platformParam =  platforms.toString();
      }
      if (categories.length > 0){
        categoryParam = categories.toString();
      }

      $location.search("excluded_platforms", platformParam);
      $location.search("excluded_categories", categoryParam);

      Data.refreshJobs = true;
      return queryBreakdown(platforms, categories);
    }



    // handle click 'all' toggle button
    $scope.toggleAll = function(itype){

        var items;
        if (itype == "c"){
            items = $scope.Categories;
            $scope.showAllCategories = !$scope.showAllCategories;
        }
        else {
            items = $scope.Platforms;
            $scope.showAllPlatforms = !$scope.showAllPlatforms;

        }

        Object.keys(items).forEach(function(item){
          var key = items[item];
          if (itype == "c"){
            key.checked = !$scope.showAllCategories;
          } else {
            key.checked = !$scope.showAllPlatforms;
          }
          _toggleItem(key, itype);

        });
        updateBreakdown();
    }


    // handle de/select individual sidebar items
    $scope.toggleItem = function(key, itype){

        // assuming after an item has been click sort has already happened
        $scope.didFirstSort = true;

        // if all items are highlighted first do a toggle all
        if (itype == "c"){
          var categories = Object.keys($scope.Categories);
          var sel = categories.filter(function(k){
            return $scope.Categories[k].checked;
          });
          if ((sel.length > 1) && (sel.length == categories.length)){
            $scope.toggleAll("c");
          }
        } else {
          var platforms = Object.keys($scope.Platforms);
          var sel = platforms.filter(function(k){
            return $scope.Platforms[k].checked;
          });
          if ((sel.length > 1) && (sel.length == platforms.length)){
            $scope.toggleAll("p");
          }
        }


        _toggleItem(key, itype);
        updateBreakdown();

    }

    function _toggleItem(key, itype){
        var selected;
        var item;
        if (itype == "c"){
            item = key.Category;
            selected = $scope.Categories[item];
        }
        else {
            item = key.Platform;
            selected = $scope.Platforms[item];
        }
        if (selected.checked){
            // toggle checked item to greyed state
            selected.Status = "greyed";
        } else {
            selected.Status = "bg-success";
        }
        selected.checked = !selected.checked;
    }

}])

angular.module('ctl.target', ['dir.d3', 'svc.targets'])

  .controller('TargetCtrl', ['$scope', '$location', 'ViewTargets', 
		function($scope, $location, ViewTargets){
			$scope.viewTargets = ViewTargets.getTargets

			// init to default target
			$scope.targetBy =  ViewTargets.defaultTarget
			console.log($scope.targetBy)
			//$location.search("ft", $scope.targetBy.i)

			var urlArgs = $location.search();

			// set target
			if ("ft" in urlArgs) {
			  $scope.targetBy = $scope.viewTargets[urlArgs.ft];
			  // Data.bucket = $scope.targetBy.bucket;
			}
  }])
angular.module('svc.targets', [])

  .provider('ViewTargets', [function (){

      var viewTargets = [{
        "title": "Couchbase Server",
        "bucket": "server",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500]
      }, {
       "title": "SDK",
        "bucket": "sdk",
        "key": "abspassed",
        "value": 0,
        "options": [0, 50, 100, 500]
      }, {
        "title": "Mobile",
        "bucket": "mobile",
        "key": "abspassed",
        "value": 0,
        "options": [0, 50, 100, 500]
      }]

      var targetMap = {} // reverse lookup map

      // add index to viewTargets and
      // setup revers lookup
      viewTargets = viewTargets.map(function(t, i){
        t['i'] = i
        targetMap[t.bucket] = t
        return t
      })

      this.currentTarget = viewTargets[0]

      this.$get = function(){
        return {
            currentTarget:  this.currentTarget,
            allTargets: function(){ return viewTargets},
            getTarget: function(target){ return targetMap[target] }, 
            setTarget: function(target){ this.currentTarget = target }
        }
      }
  }])

angular.module('ctl.timeline', ['dir.d3'])

.controller('TimelineCtrl', ['$scope', 'ViewService', 'Data', '$location', 
  function ($scope, ViewService, Data, $location){

    $scope.data = Data;
    $scope.activeBars = [];
    $scope.reverse = true;

    $scope.$watch('data.refreshTimeline', function(newVal, oldVal){

        // update timeline when data has been updated
           if (newVal  == true){
          resetTimeline();
          // trigger sidebar refresh
          Data.refreshTimeline = false;
        }

    });

    var resetTimeline = function(){

      var shorten_version_func = function(d){
          d.values = d.values.map(function(v){
              // shorten x-axis version values
              var _b = v[0].split("-");
              v[0] = _b[_b.length - 1];
              return v;
          });
         return d;

      };

      $scope.timelineAbsData = Data.timelineAbsData.map(shorten_version_func);
      $scope.timelineRelData = Data.timelineRelData.map(shorten_version_func);
      clearBarOpacity();

    };



    $scope.$on('barClick', function(event, data) {
        Data.selectedBuildObj = Data.versionBuilds[data.pointIndex];
        setBarOpacity(data.pointIndex);
        $location.search("build", Data.selectedBuildObj.Version);
        $location.search("excluded_platforms", null);
        $location.search("excluded_categories", null);
        Data.refreshSidebar = true;
        Data.refreshJobs = true;
        $scope.$apply();

    });

    function clearBarOpacity(){
      $scope.activeBars.forEach(function(bar){
          d3.select(bar).style("fill-opacity", function(d, i){
                      return 0.5;
              });
      });
    }

    function setBarOpacity(index){

        clearBarOpacity();
        $scope.activeBars = [];

        var len = Data.versionBuilds.length;
        var bars = d3.selectAll("#absTimeline rect.nv-bar")[0]
        $scope.activeBars.push(bars[index]);
        $scope.activeBars.push(bars[index + len]);

         // set active opacity
         $scope.activeBars.forEach(function(bar){
             d3.select(bar).style("fill-opacity", function(d, i){
                         return 1;
                 });
         });

        var bars = d3.selectAll("#relTimeline rect.nv-bar")[0]
        $scope.activeBars.push(bars[index]);
        $scope.activeBars.push(bars[index + len]);
        $scope.activeBars.push(bars[index + 2*len]);

        // set active opacity
        $scope.activeBars.forEach(function(bar){
            d3.select(bar).style("fill-opacity", function(d, i){
                        return 1;
                });
        });

    }

      // d3
     var format = d3.format('f');
    $scope.yAxisTickFormatFunction = function(){
      return function(d) {
        return format(Math.abs(d));
      };
    };

    $scope.relToolTipContentFunction = function() {
      return function(key, build, num) {
        return '<h4>' + num + '% ' + key.replace(', %', '') + '</h4>' +
          '<p>Build ' + build + '</p>';
      };
    };

    $scope.absToolTipContentFunction = function() {
      return function(key, build, num, data) {
        var total = Data.versionBuilds[data.pointIndex].AbsPassed +
          Data.versionBuilds[data.pointIndex].AbsFailed;
        return '<h4>' + num + ' of ' + total + ' Tests ' + key + '</h4>' +
          '<p>Build ' + build + '</p>';
      };
    };


    $scope.xFunction = function(){
      return function(d){ return d.key };
    };

    $scope.yFunction = function(){
      return function(d){ return d.value; };
    };

}])

function lastEl(a){
  if(a.length > 0) {
    return a[a.length -1];
  } else {
    return a[0];
  }
}
angular.module('ctl.version', [])

  .controller('VersionCtrl', ['$scope', 'QueryService', 'ViewTargets', 'selectedVersion', 
	function($scope, QueryService, ViewTargets, selectedVersion){
		var target = ViewTargets.currentTarget
		$scope.data = {}
		console.log("getBuilds")

        QueryService.getBuilds(target, selectedVersion)
        	.then(function(builds){
 				$scope.builds = builds
        	})

	}])

angular.module('svc.view', [])
.service("ViewService",['$http', 'Data',

  function($http, Data) {

    var mapReduceByCategoryPlatform = function(data, platforms, categories){

          // filter out matching platforms
          if (platforms && platforms.length > 0){
             data = data.filter(function(result){
              if(platforms.indexOf(result.Platform) > -1) { // exists
                return false; // exclude match
              }
              return true;
            });
          }

          // filter out matching categories
          if (categories && categories.length > 0){

             data = data.filter(function(result){
              if(categories.indexOf(result.Category) > -1) { // exists
                return false; // exclude match
              }
              return true;
            });

          }

          return data;

    }

    return {
      versions: function() {
        var config = {"url": "/versions/"+Data.bucket};

        return $http(config).then(function(response) {
              var data = response.data;
              return Object.keys(data);
        });
      },
      timeline: function(version, filterBy, endVersion) {
        var config = {"url": "/timeline/"+version+"/"+Data.bucket,
                      cache: true };

        return $http(config).then(function(response) {

          var data = response.data;
          var allBuilds, versions, versionBuilds, absData, relData;
          var low, high;

		      absData = [{
              "key": "Passed",
              "values": []
            }, {
              "key": "Failed",
              "values": []
          }];
          relData = [{
            "key": "Tests Failed, %",
            "values": []
          }, {
            "key": "Tests Passed, %",
            "values": []
          }, {
            "key": "Jobs Executed, %",
            "values": []
          }];

          allBuilds = data.map(function(build) {
            return build.Version;
          });


          var appendBuild = function(build){
              absData[0].values.push([build.Version, build.AbsPassed]);
              absData[1].values.push([build.Version, -build.AbsFailed]);
              relData[0].values.push([build.Version, build.RelFailed]);
              relData[1].values.push([build.Version, build.RelPassed]);
              relData[2].values.push([build.Version, build.RelExecuted]);
          }

          // filter builds for selected version
          versionBuilds = data.filter(function(build) {
            if (build.Version.indexOf(version) > -1){
              if(filterBy.key == "abspassed"){
                if (build.AbsPassed >= filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

              if(filterBy.key == "absfailed"){
                if (build.AbsFailed >= filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

              if(filterBy.key == "percpassed"){
                if (build.RelPassed >= filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

              if(filterBy.key == "percfailed"){
                if (build.RelFailed >= filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

            }
          });

          return {"allBuilds": allBuilds,
                  "versionBuilds": versionBuilds,
                  "absData": absData,
                  "relData" : relData};
        });
      },
      breakdown: function(build, platforms, categories){

        var config = {"url": "/breakdown/"+build+"/"+Data.bucket,
                      cache: true};
        return $http(config).then(function(response) {

          return mapReduceByCategoryPlatform(response.data, platforms, categories);
        });

      },
      jobs: function(build, platforms, categories){

        var config = {"url": "/jobs/"+build+"/"+Data.bucket,
                      cache: true};
        return $http(config).then(function(response) {

          return mapReduceByCategoryPlatform(response.data, platforms, categories);
        });
      },

      categories: function(){

        var config = {"url": "/categories/"+Data.bucket,
                      cache: true};
        return $http(config);

      },
      jobs_missing: function(build, platforms, categories){

        var config = {"url": "/jobs_missing/"+build+"/"+Data.bucket,
                      cache: false};

        return $http(config).then(function(response) {

          return mapReduceByCategoryPlatform(response.data, platforms, categories);
        });
      }
    };
}])
