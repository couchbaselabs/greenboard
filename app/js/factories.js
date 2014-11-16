var app = angular.module('greenboardFactories', ['greenboardServices']);

    app.factory('Data',  [function DataFactory() {

        return {
            build : {Version : null,
                     Passed: 0,
                     Failed: 0,
                     Status: "bg-success"},
            selectedVersion: "3.0.0",
            showAllPlatforms: true,
            showAllCategories: true,
            Categories : {},
            Platforms : {}
        }
    }]);