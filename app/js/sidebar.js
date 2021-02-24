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
			  scope.targetBy = Data.getCurrentTarget()

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
					// if(items.buildVersion != last.buildVersion){
						scope.buildVersion = items.buildVersion
					    scope.sidebarItems = {
					        platforms: _.map(items["platforms"], "key"),
							features: _.map(items["features"], "key"),
							serverVersions: _.map(items["serverVersions"], "key")
						}
						
					// }

					// if all sidebar items of a type selected
					// enable all checkmark
					var noPlatformsDisabled = !_.some(_.map(items["platforms"], "disabled"))
					var noFeaturesDisabled = !_.some(_.map(items["features"], "disabled"))
					var noServerVersionsDisabled = !_.some(_.map(items["serverVersions"], "disabled"))
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
			scope.showDashboardUrls = Data.getCurrentTarget() === "server" && Data.getSelectedVersion() === "7.0.0"

  			scope.getRunPercent = function(){
  				if(!scope.disabled){
	  				return scope.stats.percStats.run
	  			}
			  }
			  
			scope.getDashboardUrl = function() {
				if (!scope.showDashboardUrls) {
					return null;
				}
				var dashboardMap = {
					'2I_MOI': 'ovawbLBGk',
					'2I_REBALANCE': 'Yr2QbLBMz',
					ANALYTICS: 'Qb8QbYfGz',
					AUTO_FAILOVER: 'mO6lbYBGz',
					BACKUP_RECOVERY: 'Dv_QxLfGz',
					BUILD_SANITY: 'IPm-bSLMk',
					CE_ONLY: '80ZuxLBGk',
					CLI: 'U6gubLfMz',
					COLLECTIONS: 'BGtwbLfMk',
					COMPRESSION: 'RQX_bYfMz',
					DURABILITY: 'qH5QbYBMz',
					EP: 'aTj_xYBGk',
					EPHEMERAL: 'feYwbLBMk',
					EVENTING: 'k2QQbLfMk',
					FTS: 'pBAwxLfGk',
					GEO: 'Dn4ubYfGz',
					GOXDCR: 'h1JQbLfGz',
					IMPORT_EXPORT: 'kf9lbLBGk',
					IPV6: 'K_rQxLBGz',
					LOG_REDACTION: 'Cv7XxYfMz',
					MAGMA: '09PQxLBMz',
					MOBILE: 'QMRuxYBGz',
					MOBILE_CONVERGENCE: 'LyywbLfGk',
					NSERV: 'iUowxYfGz',
					OS_CERTIFY: 'Od2-6tfMk',
					PLASMA: 'qiLwbLfGk',
					QUERY: 'C2dQxYBMk',
					RBAC: 'KGXQbYBMz',
					RQG: 'tnfwbYBMk',
					RZA: 'iRIubYBMz',
					SANITY: 'tGRa6tBMk',
					SDK: 'Bdq_bLBGz',
					SECURITY: 'SpxQxYfGk',
					SUBDOC: 'feuQbYBGz',
					TUNABLE: '_LmXxYBMk',
					UNIT: 'fKMuxYBMk',
					UPGRADE: 'ftKwxYfGz',
					VIEW: '-_zubYBMk'
				}
				var dashboardId = dashboardMap[scope.key]
				if (dashboardId) {
					return "http://qe.service.couchbase.com:3000/d/" + dashboardId
				} else {
					return null;
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
			  	var thisItem = _.find(newSideBarItem[scope.type], {"key": scope.key})
			  	if(thisItem){
			  		scope.disabled = thisItem.disabled
			    }

			  	// update item stats
                scope.stats = Data.getItemStats(scope.key, scope.type)
			}, true)

			scope.$on('recalculateStats', function() {
				// update item stats e.g. when updating best run
                scope.stats = Data.getItemStats(scope.key, scope.type);
			})

  		}
  	}
  }])
