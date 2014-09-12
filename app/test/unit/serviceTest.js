'use strict';

var allVersions = {"2.2.0":true, "2.2.1":true, "2.5.0":true, "2.5.1":true, "3.0.0":true, "3.0.1":true}

var versionData = [{"Version":"2.5.0-1273","AbsPassed":66,"AbsFailed":42,"RelPassed":61.111111111111114,"RelFailed":38.888888888888886},{"Version":"2.5.0-1274","AbsPassed":66,"AbsFailed":0,"RelPassed":100,"RelFailed":0},{"Version":"2.5.1-1275","AbsPassed":66,"AbsFailed":0,"RelPassed":100,"RelFailed":0},{"Version":"2.5.1-1276","AbsPassed":227,"AbsFailed":31,"RelPassed":87.98449612403101,"RelFailed":12.015503875968992},{"Version":"3.0.0-1277","AbsPassed":74,"AbsFailed":35,"RelPassed":67.88990825688073,"RelFailed":32.11009174311926},{"Version":"3.0.0-1278","AbsPassed":74,"AbsFailed":0,"RelPassed":100,"RelFailed":0},{"Version":"3.0.1-1279","AbsPassed":74,"AbsFailed":42,"RelPassed":63.793103448275865,"RelFailed":36.206896551724135},{"Version":"3.0.1-1280","AbsPassed":74,"AbsFailed":0,"RelPassed":100,"RelFailed":0}];

var buildData = [{"Version":"3.0.0-1174","Passed":209,"Failed":4,"Category":"EP","Platform":"CENTOS","Priority":"na"},{"Version":"3.0.0-1174","Passed":35,"Failed":0,"Category":"REB","Platform":"UBUNTU","Priority":"na"},{"Version":"3.0.0-1174","Passed":35,"Failed":2,"Category":"SANITY","Platform":"DEBIAN","Priority":"na"},{"Version":"3.0.0-1174","Passed":91,"Failed":22,"Category":"TOOLS","Platform":"CENTOS","Priority":"na"},{"Version":"3.0.0-1174","Passed":136,"Failed":6,"Category":"VIEW","Platform":"CENTOS","Priority":"na"}];

var jobData = [{"Passed":33,"Total":33,"Priority":"P1","Name":"CouchbaseServer-SanityTest-4Nodes-Ubuntu64-openssl_1","Result":"SUCCESS","Url":"http://qa.sc.couchbase.com/job/CouchbaseServer-SanityTest-4Nodes-Ubuntu64-openssl_1/","Bid":452,"Version":"3.0.0-1174","Platform":"CENTOS","Category":"SANITY"},{"Passed":18,"Total":26,"Priority":"P1","Name":"ubuntu_x64--38_01--cbrecovery-P1","Result":"UNSTABLE","Url":"http://qa.hq.northscale.net/job/ubuntu_x64--38_01--cbrecovery-P1/","Bid":23,"Version":"3.0.0-1174","Platform":"CENTOS","Category":"TOOLS"},{"Passed":27,"Total":28,"Priority":"P1","Name":"ubuntu_x64--65_02--view_query_extended-P1","Result":"UNSTABLE","Url":"http://qa.sc.couchbase.com/job/ubuntu_x64--65_02--view_query_extended-P1/","Bid":169,"Version":"3.0.0-1174","Platform":"UBUNTU","Category":"VIEW"},{"Passed":6,"Total":9,"Priority":"P1","Name":"ubuntu_x64--65_03--view_dgm_tests-P1","Result":"UNSTABLE","Url":"http://qa.sc.couchbase.com/job/ubuntu_x64--65_03--view_dgm_tests-P1/","Bid":119,"Version":"3.0.0-1174","Platform":"UBUNTU","Category":"VIEW"},{"Passed":58,"Total":58,"Priority":"P1","Name":"ubuntu_x64--65_01--view_query_negative-P1","Result":"SUCCESS","Url":"http://qa.sc.couchbase.com/job/ubuntu_x64--65_01--view_query_negative-P1/","Bid":112,"Version":"3.0.0-1174","Platform":"DEBIAN","Category":"VIEW"},{"Passed":23,"Total":23,"Priority":"P1","Name":"ubuntu_x64--37_02--biXDCR-P1","Result":"SUCCESS","Url":"http://qa.hq.northscale.net/job/ubuntu_x64--37_02--biXDCR-P1/","Bid":26,"Version":"3.0.0-1174","Platform":"DEBIAN","Category":"XDCR"},{"Passed":43,"Total":43,"Priority":"P1","Name":"ubuntu_x64--01_03--rebalanceXDCR_SSL-P0","Result":"SUCCESS","Url":"http://qa.hq.northscale.net/job/ubuntu_x64--01_03--rebalanceXDCR_SSL-P0/","Bid":11,"Version":"3.0.0-1174","Platform":"UBUNTU","Category":"XDCR"},{"Passed":1,"Total":1,"Priority":"P1","Name":"ubuntu_x64--36_01--XDCR_upgrade-P1","Result":"SUCCESS","Url":"http://qa.hq.northscale.net/job/ubuntu_x64--36_01--XDCR_upgrade-P1/","Bid":41,"Version":"3.0.0-1174","Platform":"UBUNTU","Category":"XDCR"},{"Passed":136,"Total":142,"Priority":"P0","Name":"ubuntu_x64-00-02-tunable-xdcr-P0","Result":"UNSTABLE","Url":"http://qa.sc.couchbase.com/job/ubuntu_x64-00-02-tunable-xdcr-P0/","Bid":92,"Version":"3.0.0-1174","Platform":"CENTOS","Category":"VIEW"},{"Passed":43,"Total":43,"Priority":"P1","Name":"ubuntu_x64--01_02--rebalanceXDCR-P0","Result":"SUCCESS","Url":"http://qa.hq.northscale.net/job/ubuntu_x64--01_02--rebalanceXDCR-P0/","Bid":46,"Version":"3.0.0-1174","Platform":"UBUNTU","Category":"XDCR"}];


describe('Dashboard services', function() {

  var viewService, httpBackend, nvd3ChartDirectives;

  // load modules
  beforeEach(module('greenBoard'));

  beforeEach(inject(function(_ViewService_, $httpBackend){
    viewService = _ViewService_;
    httpBackend = $httpBackend;
  }));


  it('check the existence of View factory', inject(function(ViewService) {
      expect(ViewService).toBeDefined();
   }));

  /*
  it('check full all versions', inject(function(ViewService) {
      httpBackend.whenGET("/versions").respond(allVersions);
      ViewService.versions().then(function(response){
        expect(response).toEqual(['2.2.0', '2.2.1','2.5.0', '2.5.1', '3.0.0', '3.0.1']);
      });
      httpBackend.flush();
  }));



  it('check filtered timeline builds', inject(function(ViewService) {
      httpBackend.whenGET("/timeline").respond(versionData);

      ViewService.timeline("2.5.0").then(function(response){
        expect(response.allBuilds).toEqual(['2.5.0-1273', '2.5.0-1274',
                                         '2.5.1-1275', '2.5.1-1276', '3.0.0-1277',
                                         '3.0.0-1278', '3.0.1-1279', '3.0.1-1280' ]);
      });

      httpBackend.flush();
   }));

  it('check filtered timeline builds filtered by version', inject(function(ViewService) {
      httpBackend.whenGET("/timeline").respond(versionData);

      ViewService.timeline("2.5.0").then(function(response){
        expect(response.versionBuilds.length).toEqual(2);
      });

      httpBackend.flush();
   }));

*/
  it('check breakdown all builds', inject(function(ViewService) {

      httpBackend.whenGET("/breakdown?build=3.0.0-1174").respond(buildData);

      ViewService.breakdown("3.0.0-1174").then(function(response){
        expect(response.length).toEqual(5);
      });
      httpBackend.flush();
  }));

  it('check breakdown by platform', inject(function(ViewService) {

      httpBackend.whenGET("/breakdown?build=3.0.0-1174").respond(buildData);

      ViewService.breakdown("3.0.0-1174", ["CENTOS"]).then(function(response){
        expect(response.length).toEqual(3);
      });
      httpBackend.flush();
  }));

  it('check breakdown by category', inject(function(ViewService) {

      httpBackend.whenGET("/breakdown?build=3.0.0-1174").respond(buildData);
      ViewService.breakdown("3.0.0-1174", [], ["REB"]).then(function(response){
        expect(response.length).toEqual(1);
      });

      httpBackend.flush();
  }));

  it('check breakdown by platform and category', inject(function(ViewService) {

      httpBackend.whenGET("/breakdown?build=3.0.0-1174").respond(buildData);
      ViewService.breakdown("3.0.0-1174", ["CENTOS"], ["VIEW"]).then(function(response){
        expect(response[0].Passed).toEqual(136);
        expect(response[0].Failed).toEqual(6);
      });
      httpBackend.flush();
  }));

  it('check breakdown by multi-platform', inject(function(ViewService) {

      httpBackend.whenGET("/breakdown?build=3.0.0-1174").respond(buildData);
      ViewService.breakdown("3.0.0-1174", ["CENTOS", "UBUNTU"]).then(function(response){
        expect(response.length).toEqual(4);
      });

      httpBackend.flush();
  }));

  it('check jobs by platform', inject(function(ViewService) {

      httpBackend.whenGET("/jobs?build=3.0.0-1174").respond(jobData);
      ViewService.jobs("3.0.0-1174", ["CENTOS"]).then(function(response){
        expect(response.length).toEqual(3);
      });

      httpBackend.flush();
  }));

  it('check jobs by platform and category', inject(function(ViewService) {

      httpBackend.whenGET("/jobs?build=3.0.0-1174").respond(jobData);
      ViewService.jobs("3.0.0-1174", ["CENTOS"], ["VIEW"]).then(function(response){
        expect(response[0].Passed).toEqual(136);
        expect(response[0].Total).toEqual(142);
      });
      httpBackend.flush();
  }));



});
