angular.module('app.sidebar', [])

  .directive('buildSidebar', ['Data', function(Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {
	  			onClick: "="
	  		},
	  		templateUrl: 'partials/sidebar.html',
	  		link: function(scope, elem, attrs){

	  		  scope.showPerc = false

	  		  scope.$watch(function(){ return Data.getBuildBreakdown() }, 
            	function(breakdown){
            		// breakdown has changed
  	  				if(!breakdown) { return }
  	  				breakdown["Version"] = Data.getBuild()
  	  				scope.build = breakdown
	  			})

	  		}
	  	}
  }])

  .directive('sidebarItem', [function(){
  	return {
  		restrict: 'E',
  		scope: {
  			item: "=",
  			title: "=",
  			asNum: "=showPerc"
  		},
  		templateUrl: "partials/sidebar_item.html",
  		link: function(scope, elem, attrs){

	  		scope.getNumOrPerc = function(key){
	  			// toggle by number or percentage
	  			var asNum = scope.asNum
	  			var item = scope.item
	  			if(!item){ return }
	  			if(key=="pass"){
	  				if(asNum){ return item.Passed }
	  				return getPercOfValStr(item, item.Passed)
	  			}
	  			if(key=="fail"){
	  				if(asNum){ return item.Failed }
	  				return getPercOfValStr(item, item.Failed)
	  			}
	  			if(key=="pend"){
	  				if(asNum){ return item.Pending }
	  				return getPercOfValStr(item, item.Pending)
	  			}
	  		}
  			scope.getRunPercent = function(){ return getItemPercStr(scope.item) }

	  		// set item bg
  			passPerc = scope.getNumOrPerc("pass")
  			if(passPerc == 100){
	  			scope.bgColor = "bg-success"
	  		} else if(passPerc >= 70){
	  			scope.bgColor = "bg-warning"
	  		} else {
	  			scope.bgColor = "bg-danger"
	  		}

  		}
  	}
  }])

function getPercOfVal(item, val){
  if (!item){
    return 0;
  }

  var denom = item.Passed + item.Failed;
  if(denom == 0){ return 0; }
  return Math.floor(100*((val/denom).toFixed(2)));
}

function getPercOfValStr(item, val){
  return getPercOfVal(item, val)+"%"
}

function getItemPerc(item){
  if (!item){
    return 0;
  }

  var total = item.Passed + item.Failed;
  var denom = total + item.Pending;
  if(denom == 0){ return 0; }

  return Math.floor(100*((total/denom).toFixed(2)));
}

function getItemPercStr(item){
	return getItemPerc(item)+"%"
}

