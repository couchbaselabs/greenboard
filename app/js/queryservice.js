angular.module('svc.query', [])
	.service("QueryService",['$http',
		function($http){
		  return {
			getVersions: function(target){
				var url = ["versions", target].join("/")
		        return $http({"url": url, cache: true})
		        			.then(function(response){
		        				return response.data
		        			})
			},
			getBuilds: function(target, version, params){
				var url = ["builds", target, version].join("/")
		        return $http({"url": url, params: params, cache: false})
		        			.then(function(response){
		        				return response.data
		        			})				
			},
			getJobs: function(build, target){
				var url = ["jobs", build, target].join("/")
		        return $http({"url": url, cache: false})
		        			.then(function(response){
		        				return response.data
		        			})				
			}
		  }
		}])
