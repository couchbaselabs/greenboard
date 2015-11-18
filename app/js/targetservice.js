angular.module('svc.targets', [])

  .provider('ViewTargets', [function (){

      var viewTargets = [{
        "title": "Couchbase Server",
        "bucket": "server",
        "key": "abspassed",
        "value": 100,
        "options": [0, 50, 100, 500]
      }, {
       "title": "SDK",
        "bucket": "sdk",
        "key": "abspassed",
        "value": 0,
        "options": [0, 50, 100, 500]
      }, {
        "title": "Mobile",
        "bucket": "mobile",
        "key": "abspassed",
        "value": 0,
        "options": [0, 50, 100, 500]
      }]

      var targetMap = {} // reverse lookup map

      // add index to viewTargets and
      // setup revers lookup
      viewTargets = viewTargets.map(function(t, i){
        t['i'] = i
        targetMap[t.bucket] = t
        return t
      })

      this.currentTarget = viewTargets[0]

      this.$get = function(){
        return {
            currentTarget:  this.currentTarget,
            allTargets: function(){ return viewTargets},
            getTarget: function(target){ return targetMap[target] }, 
            setTarget: function(target){ this.currentTarget = target }
        }
      }
  }])
