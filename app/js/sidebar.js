angular.module('app.sidebar', [])

  .directive('buildSidebar', ['Data', function(Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {
	  			onClick: "="
	  		},
	  		templateUrl: 'partials/sidebar.html',
	  		link: function(scope, elem, attrs){

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
  			title: "="
  		},
  		templateUrl: "partials/sidebar_item.html"
  	}
  }])