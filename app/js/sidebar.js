angular.module('app.sidebar', [])

  .directive('viewSidebar', ['Data', function(Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {},
	  		templateUrl: 'partials/sidebar.html',
	  		link: function(scope, elem, attrs){

	  		  scope.showPerc = false
	  		  scope.disablePlatforms = false
	  		  scope.disableFeatures = false
	  		  scope.disabledServerVersions = false
              scope.buildVersion = Data.getBuild()

	  		  scope.toggleAll = function(type){
	  		  	var isDisabled;
	  		  	
	  		  	if(type=="platforms"){
	  		  		isDisabled = !scope.disablePlatforms
		  		  	scope.disablePlatforms = isDisabled
		  		 } else if(type=="features"){
		  		 	isDisabled = !scope.disableFeatures
		  		 	scope.disableFeatures = isDisabled
		  		 } else if(type=="serverVersions"){
	  		  		isDisabled = !scope.disabledServerVersions
	  		  		scope.disabledServerVersions = isDisabled
				}
	  		  	Data.toggleAllSidebarItems(type, isDisabled)
	  		  }

			  // Detect when build has changed
			  scope.$watch(function(){ return Data.getSideBarItems() }, 
				function(items, last){

					if(!items) { return }

					// only update sidebar items on build change
					if(items.buildVersion != last.buildVersion){
						scope.buildVersion = items.buildVersion
					    scope.sidebarItems = {
					        platforms: _.pluck(items["platforms"], "key"),
					        features: _.pluck(items["features"], "key"),
							serverVersions: _.pluck(items["serverVersions"], "key")
					    }
					}

					// if all sidebar items of a type selected
					// enable all checkmark
					var noPlatformsDisabled = !_.any(_.pluck(items["platforms"], "disabled"))
					var noFeaturesDisabled = !_.any(_.pluck(items["features"], "disabled"))
					var noServerVersionsDisabled = !_.any(_.pluck(items["serverVersions"], "disabled"))
					scope.disablePlatforms = !noPlatformsDisabled
					scope.disableFeatures = !noFeaturesDisabled
					scope.disabledServerVersions = !noServerVersionsDisabled
				}, true)

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
	  			if(scope.type == "build"){ return } // not clickable
		  		Data.toggleItem(scope.key, scope.type, !scope.disabled)
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
            // only set color to danger if we can prove jobs actually are failing
            if(stats.absStats.failed > 0){
              color = "bg-danger"
            } else {
              color = "bg-muted"
            }
		  		}
		  		return color
		  	}

            // deep watch sidebar to update item stats
		    scope.$watch(function(){ return Data.getSideBarItems() },
			  function(newSideBarItem){

			  	// we'll get notified here if this item was disabled
			  	var thisItem = _.find(newSideBarItem[scope.type], "key", scope.key)
			  	if(thisItem){
			  		scope.disabled = thisItem.disabled
			    }

			  	// update item stats
                scope.stats = Data.getItemStats(scope.key, scope.type)
			}, true)

  		}
  	}
  }])
