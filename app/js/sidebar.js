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
  	  				scope.build = breakdown
  	  				breakdown["Version"] = Data.getBuild()
	  			})

	  		}
	  	}
  }])

  .directive('sidebarItem', ['Data', function(Data){
  	return {
  		restrict: 'E',
  		scope: {
  			item: "&",
  			disabled: "&",
  			title: "@",
  			asNum: "&showPerc"
  		},
  		templateUrl: "partials/sidebar_item.html",
  		link: function(scope, elem, attrs){


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
  				if(!scope.disabled()){
	  				return getItemPercStr(scope.item())
	  			}
  			}

	  		// configure visibility
	  		scope.toggleItem = function(){
		  		Data.toggleItem(scope.title, scope.disabled())
	  		}

	  		// set item bg
	  		scope.bgColor = function(){
	  			var color = "greyed"
	  			if(scope.disabled()){
					scope.glyphiconClass="glyphicon-unchecked"
					return color
				}

	 			var item = scope.item()
				scope.glyphiconClass="glyphicon-check"
	  			passPerc = getPercOfVal(item, item.Passed)
	  			if(passPerc == 100){
		  			color = "bg-success"
		  		} else if(passPerc >= 70){
		  			color = "bg-warning"
		  		} else if(passPerc >= 0) {
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
	if (getItemPerc(item) >= 0){
		return getItemPerc(item)+"%"
	}
}

