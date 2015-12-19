angular.module('app.infobar', [])

  .directive('viewInfobar', ['Data',
  	function(Data){
 	  	return {
	  		restrict: 'E',
	  		scope: {},
	  		templateUrl: 'partials/infobar.html',
	  		link: function(scope, elem, attrs){

          scope.expandedIndexes = []
          scope.expandChange = function(index){
            if(scope.isExpanded(index)){
              // collapse
              var at = _.indexOf(scope.expandedIndexes, index)
              console.log('pop', index, at)
              scope.expandedIndexes.splice(at, 1)
            } else {
              // expand
              console.log('push', index)
              scope.expandedIndexes.push(index)
            }
          }

          scope.isExpanded = function(index){
            return scope.expandedIndexes.indexOf(index) > -1
          }

          scope.formatChangeMsg = function(msg){
            var parts = msg.split("\n")
            var html = parts[0]
            if(parts.length > 1){
              // wrap in review url
              var reviewUrl = parts[2].replace("Reviewed-on: ", "")
              html = '<a href="'+reviewUrl+'">'+html+'</a>'
            }
            return html
          }

          scope.$watch(function(){return Data.getBuildInfo()},
            function(info){
              if(info){
                scope.info = info
              }
            })

	  		}
	  	}
  }])