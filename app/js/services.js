var serviceApp = angular.module('greenboardServices', []);

serviceApp.service("ViewService",['$http',
  function($http) {

    var mapReduceByCategoryPlatform = function(data, platforms, categories){

          if (platforms && platforms.length > 0){
            // filter for inclusive match
            data = data.filter(function(result){
              return platforms.indexOf(result.Platform) > -1;
            });
          } else {
            platforms = data.map(function(result){
              return result.Platform;
            });
            platforms = platforms.filter(function(e, pos){
              return platforms.indexOf(e) === pos;
            });
          }

          if (categories && categories.length > 0){

            // filter for inclusive match
            data = data.filter(function(result){
              return categories.indexOf(result.Category) > -1;
            });
          }
          return data;

    }

    return {
      versions: function() {
        return $http.get("/versions").then(function(response) {
              var data = response.data;
              return Object.keys(data);
        });
      },
      timeline: function(version, filterBy) {
        return $http.get("/timeline", { cache: true}).then(function(response) {

          var data = response.data;
          var allBuilds, versions, versionBuilds, absData, relData;
          var low, high;

		      absData = [{
              "key": "Passed",
              "values": []
            }, {
              "key": "Failed",
              "values": []
          }];
          relData = [{
            "key": "Passed, %",
            "values": []
          }, {
            "key": "Failed, %",
            "values": []
          }];

          allBuilds = data.map(function(build) {
            return build.Version;
          });


          var appendBuild = function(build){
              absData[0].values.push([build.Version, build.AbsPassed]);
              absData[1].values.push([build.Version, -build.AbsFailed]);
              relData[0].values.push([build.Version, build.RelPassed]);
              relData[1].values.push([build.Version, build.RelFailed]);
          }

          // filter builds for selected version
          versionBuilds = data.filter(function(build) {
            if (build.Version.indexOf(version) > -1){
              if(filterBy.key == "abspassed"){
                if (build.AbsPassed > filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

              if(filterBy.key == "absfailed"){
                if (build.AbsFailed > filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

              if(filterBy.key == "percpassed"){
                if (build.RelPassed > filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

              if(filterBy.key == "percfailed"){
                if (build.RelFailed > filterBy.value) {
                  appendBuild(build);
                  return true;
                }
              }

            }
          });

          return {"allBuilds": allBuilds,
                  "versionBuilds": versionBuilds,
                  "absData": absData,
                  "relData" : relData};
        });
      },
      breakdown: function(build, platforms, categories){

        var config = {"url": "/breakdown",
                      "params": {"build": build},
                      cache: true};
        return $http(config).then(function(response) {

          return mapReduceByCategoryPlatform(response.data, platforms, categories);
        });

      },
      jobs: function(build, platforms, categories){

        var config = {"url": "/jobs",
                      "params": {"build": build},
                      cache: true};
        return $http(config).then(function(response) {

          return mapReduceByCategoryPlatform(response.data, platforms, categories);
        });
      }
    };
}]);
