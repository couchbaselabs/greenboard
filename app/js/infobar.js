angular.module('app.infobar', [])

  .directive('viewInfobar', ['Data', 'QueryService',
  	function(Data, QueryService){
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
              scope.expandedIndexes.splice(at, 1)
            } else {
              // expand
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

          // watch for changes in active build and attempt to get info
          scope.$watch(function(){return Data.getBuild()},
            function(build, lastbuild){
                var target = Data.getCurrentTarget()
                QueryService.getBuildInfo(build, target)
                  .then(function(response){
                    var info = {}
                    info = response['value']
                    if(response.err){ console.log(build, response.err) }
                    scope.info = info
                  })
            })

	  		}
	  	}
  }])