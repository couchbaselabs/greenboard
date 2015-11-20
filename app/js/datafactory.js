angular.module('svc.data', [])
    .provider('Data', [function (){

        this.versions = [];
        this.target = "server";
        this.version = null;
        this.versions = [];  

        this.$get = function(){
            return {
                setTarget: function(target){
                    this.target = target
                },
                setTargetVersions: function(versions){
                    this.versions = versions
                },
                setSelectedVersion: function(version){
                    this.version = version
                },
                getCurrentTarget: function(){
                    return this.target
                },
                getTargetVersions: function(){
                    return this.versions
                },
                getSelectedVersion: function(){
                    return this.version
                }

            }
        }
}])


