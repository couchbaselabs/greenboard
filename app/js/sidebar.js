angular.module('app.sidebar', [])

  .directive('viewSidebar', ['Data', function(Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {},
	  		templateUrl: 'partials/sidebar.html',
	  		link: function(scope, elem, attrs){

	  		  scope.showPerc = false

			  scope.$watch(function(){ return Data.getSideBarItems() }, 
				function(items){
					// breakdown has changed
					if(!items) { return }
					scope.buildVersion = Data.getBuild()
				    scope.sidebarItems = items
				})

	  		}
	  	}
  }])

  .directive('sidebarItem', ['Data', function(Data){
  	return {
  		restrict: 'E',
  		scope: {
  			type: "@",
  			key: "@",
  			asNum: "&showPerc"
  		},
  		templateUrl: "partials/sidebar_item.html",
  		link: function(scope, elem, attrs){

  			//TODO: allow modify by location url

  			scope.disabled = false
  			scope.stats = Data.getItemStats(scope.key, scope.type)



  			scope.getRunPercent = function(){
  				// NOTE: scope stats are updated on digest loop here
	  			scope.stats = Data.getItemStats(scope.key, scope.type)
  				if(!scope.disabled){
	  				return scope.stats.percStats.run
	  			}
  			}

	  		scope.getNumOrPerc = function(key){
	  			// return value by number or percentage
	  			var stats = scope.stats
	  			var asNum = scope.asNum()
	  			return asNum ? stats.absStats[key] : stats.percStats[key]
	  		}

	  		// configure visibility
	  		scope.toggleItem = function(){
	  			var newDisabledState = !scope.disabled
		  		Data.toggleItem(scope.key, scope.type, newDisabledState)
	  			scope.disabled = newDisabledState
	  		}


	  		// set item bg
	  		scope.bgColor = function(){
	  			var color = "greyed"
	  			var stats = scope.stats
	  			if(scope.disabled){
					scope.glyphiconClass="glyphicon-unchecked"
					return color
				}

				scope.glyphiconClass="glyphicon-check"
	  			passPerc = stats.percStats.passedRaw
	  			if(passPerc == 100){
		  			color = "bg-success"
		  		} else if(passPerc >= 70){
		  			color = "bg-warning"
		  		} else if(passPerc >= 0) {
		  			// only set color to danger if we can prove jobs actually
		  			// failed or are pending
		  			if((stats.absStats.pending + stats.absStats.failed) > 0){
			  			color = "bg-danger"
			  		}
		  		}
		  		return color
		  	}

  		}
  	}
  }])