package main

import (
	"encoding/json"
	"log"
        "strings"
	"io/ioutil"
	"github.com/couchbaselabs/go-couchbase"
	"github.com/hoisie/web"
)

var ddocs = map[string]string{
	"jenkins": `{
		"views": {
			"data_by_build": {
				"map": "function(doc, meta){ emit([doc.build, doc.os, doc.component], [doc.totalCount - doc.failCount,doc.failCount,  doc.priority, doc.name, doc.result, doc.url, doc.build_id]);}",
                                "reduce" : "function (key, values, rereduce) { var fAbs = 0; var pAbs = 0; for(i=0;i < values.length; i++) { pAbs = pAbs + values[i][0]; fAbs = fAbs + values[i][1]; } var total = fAbs + pAbs; var pRel = 100.0*pAbs/total; var fRel = 100.0*fAbs/total; return ([pAbs, fAbs, pRel, fRel]); }"
            }
		}
	}`,
}


type DataSource struct {
	CouchbaseAddress string
	Release          string
        AllVersions      map[string]bool
}

func (ds *DataSource) GetBucket(bucket string) *couchbase.Bucket {
	client, _ := couchbase.Connect(ds.CouchbaseAddress)
	pool, _ := client.GetPool("default")

	b, err := pool.GetBucket(bucket)
	if err != nil {
		log.Fatalf("Error reading bucket:  %v", err)
	}
	return b
}

func (ds *DataSource) QueryView(b *couchbase.Bucket, ddoc, view string,
	params map[string]interface{}) []couchbase.ViewRow {
	params["stale"] = "false"
	vr, err := b.View(ddoc, view, params)
	if err != nil {
       log.Println(err);
	   ds.installDDoc(ddoc)
	}
    return vr.Rows
}

func (ds *DataSource) installDDoc(ddoc string) {
	b := ds.GetBucket(ddoc) // bucket name == ddoc name
	err := b.PutDDoc(ddoc, ddocs[ddoc])
	if err != nil {
		log.Fatalf("%v", err)
	}
}

var TIMELINE_SIZE = 40

var VIEW = map[string]int{
	"absPassed":  0,
	"absFailed":  1,
	"priority":   2,
	"name":       3,
	"result":     4,
	"url":        5,
	"bid":        6,
}

var REDUCE = map[string]int{
    "absPassed": 0,
    "absFailed": 1,
    "relPassed": 2,
    "relFailed": 3,
}

type MapBuild struct {
	Version string
	Passed   float64
	Failed   float64
	Category string
	Platform string
	Priority string
}

type Breakdown struct {
	Passed float64
	Failed float64
}

type Job struct {
    Passed   float64
    Total float64
    Priority string
    Name string
    Result string
    Url string
    Bid float64
    Version string
    Platform string
    Category string
}

type ReduceBuild struct {
	Version string
	AbsPassed  float64
	AbsFailed  float64
	RelPassed  float64
	RelFailed  float64
}


func appendIfUnique(slice []string, s string) []string {
	for i := range slice {
		if slice[i] == s {
			return slice
		}
	}
	return append(slice, s)
}

func posInSlice(slice []string, s string) int {
	for i := range slice {
		if slice[i] == s {
			return i
		}
	}
	return -1
}


func (ds *DataSource) GetJobs(ctx *web.Context) []byte {
    b := ds.GetBucket("jenkins")

    var version string
    for k,v := range ctx.Params {
        if k == "build" {
            version = v;
        }
    }
    params := map[string]interface{}{
       "start_key":  []interface{}{version},
       "end_key":  []interface{}{version+"_"},
       "reduce": false,
       "stale": false,
    }


    jobs := []Job{}
    rows := ds.QueryView(b, "jenkins", "data_by_build", params)
    for _, row := range rows {
	meta := row.Key.([]interface{})
	jversion := meta[0].(string)
	platform := meta[1].(string)
	category := meta[2].(string)

        if jversion == version {
           value := row.Value.([]interface{})
           passed := value[VIEW["absPassed"]].(float64)
           failed := value[VIEW["absFailed"]].(float64)
           priority := value[VIEW["priority"]].(string)
           name := value[VIEW["name"]].(string)
           result := value[VIEW["result"]].(string)
           url := value[VIEW["url"]].(string)
           bid := value[VIEW["bid"]].(float64)

           jobs = append(jobs, Job{
              passed,
              passed + failed,
              priority,
              name,
              result,
              url,
              bid,
              jversion,
              platform,
              category,
           })
        }
    }

    j, _ := json.Marshal(jobs)
    return j
}

func (ds *DataSource) GetBreakdown(ctx *web.Context) []byte {
	b := ds.GetBucket("jenkins")
    version := ds.Release;
    for k,v := range ctx.Params {
        if k == "build" {
            version = v;
        }
    }
    params := map[string]interface{}{
    "start_key":  []interface{}{version},
    "end_key":  []interface{}{version+"_"},
    "group_level" : 3,
    }
	rows := ds.QueryView(b, "jenkins", "data_by_build", params)

	/***************** MAP *****************/
	mapBuilds := []MapBuild{}
	for _, row := range rows {
		meta := row.Key.([]interface{})

		value := row.Value.([]interface{})
		failed, ok := value[REDUCE["absFailed"]].(float64)
		if !ok {
			continue
		}
        if failed < 0 {
            failed = failed * -1
        }
		passed , ok := value[REDUCE["absPassed"]].(float64)
		if !ok {
			continue
		}
		version  := meta[0].(string)
		platform := meta[1].(string)
		category := meta[2].(string)

		mapBuilds = append(mapBuilds, MapBuild{
            version,
			passed,
			failed,
			category,
			platform,
			"na",
		})
	}


	j, _ := json.Marshal(mapBuilds)
	return j
}

func (ds *DataSource) GetTimeline(ctx *web.Context) []byte {

    var start_key string
    var end_key string
    for k,v := range ctx.Params {
        if k == "low" {
            start_key = v;
        }
        if k == "high" {
            end_key= v;
        }
    }

    return ds._GetTimeline(start_key, end_key)
}

func (ds *DataSource) _GetTimeline(start_key string, end_key string) []byte{

    if start_key =="" {
        start_key = " "
    }
    if end_key == ""{
       end_key = "9999"
    }

    b := ds.GetBucket("jenkins")
    params := map[string]interface{}{
        "start_key":  []interface{}{start_key},
        "end_key":  []interface{}{end_key},
        "inclusive_end": true,
        "group_level" : 1,
    }
	rows := ds.QueryView(b, "jenkins", "data_by_build", params)

	/***************** Query Reduce Views*****************/
	reduceBuild := []ReduceBuild{}
	for _, row := range rows {
		rowKey := row.Key.([]interface{})
        version := rowKey[0].(string)
        if version == "0.0.0-xxxx" {
            continue
        }

        versionMain := strings.Split(version,"-")[0]
        ds.AllVersions[versionMain] = true
         value := row.Value.([]interface{})
         reduceBuild = append(reduceBuild,
                ReduceBuild{
                version,
                value[REDUCE["absPassed"]].(float64),
                value[REDUCE["absFailed"]].(float64),
                value[REDUCE["relPassed"]].(float64),
                value[REDUCE["relFailed"]].(float64),
            })
	}

	j, _ := json.Marshal(reduceBuild)
	return j
}

func (ds *DataSource)GetAllVersions() []byte{
    j, _ := json.Marshal(ds.AllVersions)
    return j
}

func (ds *DataSource)BootStrap() {
  ds.AllVersions = make(map[string]bool)
  ds._GetTimeline("","")
}

func (ds *DataSource)GetIndex() []byte {
  content, _ := ioutil.ReadFile(pckgDir + "app/index.html")
  return content
}
