function pieChartDirective(){

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
        scope: { data: '=' }
    }
}

function barChartDirective(Data, $location){

    var margin = {top: 40, right: 10, bottom: 20, left: 50},
        width = 960 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;

    function loadTimeline(scope, data, el){
            var passed = data[0].values;
            var failed = data[1].values;

            var n = 2;
            var m = passed.length;
            var t = 30; // truncation value
            stack = d3.layout.stack();
            // truncate beyond 30 values
            if(m > t){
                passed.splice(0, m-t);
                failed.splice(0, m-t);
            }

            layers = [
                { "name": "passed",
                  "values": passed.map(function(d, i){
                     return {"x": i,
                             "y": d[1],
                             "y0": 0,
                             "bno": d[0]}})
                },
                { "name": "failed",
                  "values": failed.map(function(d, i){
                     return {"x": i,
                             "y": -1*d[1],
                             "y0": 0,
                             "bno": d[0]}})
                }
            ]

            yGroupMax = d3.max(passed, function(d) { return d[1]; });

            var x = d3.scale.ordinal()
                .domain(passed.map(function(d){ return d[0]}))
                .rangeRoundBands([0, width], .08);

            var y = d3.scale.linear()
                .domain([0, yGroupMax])
                .range([height, 0]);

            var colors = ["#3bc93b", "#de0000"];


            var svg = d3.select(el).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform",
                     "translate(" + margin.left + "," + margin.top + ")");

            var tickerMod = 1;
            if(m > 10){
                tickerMod = Math.floor(m/10);
            }

            var xTickerValues = passed.filter(function(d, i){
                      return (i%tickerMod == 0) }).map(function(d){
                            return d[0]});

            var xAxis = d3.svg.axis()
                .scale(x)
                .tickValues(xTickerValues)
                .tickSize(0)
                .tickPadding(6)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .tickSize(-width, 0, 0)
                .tickPadding(6)
                .orient("left")
                .ticks(3);
                

            var layer = svg.selectAll(".layer")
                .data(layers)
              .enter().append("g")
                .attr("class", "layer")
                .style("fill", function(d, i) { return colors[i]; });

            var opaqueLevel = function(d){
                var selectedBno = 
                    Data.selectedBuildObj.Version.split("-")[1];
                if (selectedBno == d.bno){
                    return 1;
                }
                return 0.5; 
            }

            var rect = layer.selectAll("rect")
                .data(function(d) {return d.values;})
              .enter().append("rect")
                .attr("x", function(d, i) {return x(d.bno)})
                .attr("y", height)
                .style("opacity", opaqueLevel)
                .attr("width", x.rangeBand())
                .attr("height", 0);

            rect.on("click", function(event, i) {
                Data.selectedBuildObj = Data.versionBuilds[i];
                $location.search("build", Data.selectedBuildObj.Version);
                $location.search("excluded_platforms", null);
                $location.search("excluded_categories", null);
                Data.refreshSidebar = true;
                Data.refreshJobs = true;

                // set opacity
                rect.transition()
                    .delay(2)
                    .style("opacity", opaqueLevel);

                scope.$apply();
            });


            rect.transition()
                .delay(function(d, i) { return i * 10; })
                .attr("y", function(d) { return y(d.y); })
                .attr("height", function(d) {
                     return y(d.y0) - y(d.y0 + d.y); });

            var zoom = d3.behavior.zoom().scaleExtent([1, 1]);
            zoom.x(x);
            zoom.on('zoom', function() { 
              svg.select(".x.axis").call(xAxis);
                console.log("zumba?");
                //svg.selectAll(".layer").data(layers);
            });

            svg.call(zoom);
            svg.append("g")
                .attr("class", "x axis grid")
                .attr("transform", "translate(0,"+height+")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "x axis grid")
                .attr("transform", "translate(10,0)")
                .call(yAxis);
        
    }

    function link(scope, element, attr){

        scope.$watch('data', function(data){
            if(data){
                d3.select(element[0]).select("svg").remove();
                loadTimeline(scope, data, element[0]);
            }
        }, true);
    }

    return {
        link: link,
        restrict: 'E',
        scope: { data: '=' }
    }
}

