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
  			item: "&",
  			title: "@",
  			asNum: "&showPerc"
  		},
  		templateUrl: "partials/sidebar_item.html",
  		link: function(scope, elem, attrs){

  			// TODO: probably want this from scope
	  		scope.isVisible = true
			scope.glyphiconClass="glyphicon-check"

	  		scope.getNumOrPerc = function(key){
	  			// toggle by number or percentage
	  			var asNum = scope.asNum()
	  			var item = scope.item()
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
  			scope.getRunPercent = function(){ 
  				if(scope.isVisible){
	  				return getItemPercStr(scope.item())
	  			}
  			}

	  		// configure visibility
	  		scope.toggleVisible = function(){
	  			scope.isVisible = !scope.isVisible
	  			if(scope.isVisible){
		  			scope.glyphiconClass="glyphicon-check"
		  		} else {
		  			scope.glyphiconClass="glyphicon-unchecked"
		  		}
	  		}

	  		// set item bg
	  		scope.bgColor = function(){
	  			if(!scope.isVisible){
	  				return "greyed"
	  			}
	  			var item = scope.item()
	  			passPerc = getPercOfVal(item, item.Passed)
	  			if(passPerc == 100){
		  			color = "bg-success"
		  		} else if(passPerc >= 70){
		  			color = "bg-warning"
		  		} else {
		  			color = "bg-danger"
		  		}
		  		return color
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

