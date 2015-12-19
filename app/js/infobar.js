angular.module('app.infobar', [])

  .directive('viewInfobar', ['Data',
  	function(Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {},
	  		templateUrl: 'partials/infobar.html',
	  		link: function(scope, elem, attrs){

          scope.$watch(function(){return Data.getBuildInfo()},
            function(info){
              if(info){
                scope.info = info
              }
            })

	  		}
	  	}
  }])