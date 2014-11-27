package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"regexp"
	"strings"

	"github.com/couchbaselabs/go-couchbase"
	"github.com/hoisie/web"
)

var viewspec = `{
	"views": {
			"data_by_build": {
				"map": "function(doc, meta){ emit([doc.build, doc.os, doc.component], [doc.totalCount - doc.failCount,doc.failCount,  doc.priority, doc.name, doc.result, doc.url, doc.build_id]);}",
                                "reduce" : "function (key, values, rereduce) { var fAbs = 0; var pAbs = 0; for(i=0;i < values.length; i++) { pAbs = pAbs + values[i][0]; fAbs = fAbs + values[i][1]; } var total = fAbs + pAbs; var pRel = 100.0*pAbs/total; var fRel = 100.0*fAbs/total; return ([pAbs, fAbs, pRel, fRel]); }"
            },
			"jobs_by_build": {
				"map": "function(doc, meta){ emit(doc.build, [doc.name, doc.os, doc.component, doc.url, doc.priority]);}",
				"reduce": "_count"
			}
		}
	}`

type DataSource struct {
	CouchbaseAddress string
	Bucket           string
	AllVersions      map[string]bool
	JobsByVersion    map[string]float64
}

type Api struct {
	DataSources      map[string]*DataSource
	CouchbaseAddress string
}

func (ds *DataSource) GetBucket() *couchbase.Bucket {
	client, _ := couchbase.Connect(ds.CouchbaseAddress)
	pool, _ := client.GetPool("default")

	b, err := pool.GetBucket(ds.Bucket)
	if err != nil {
		log.Fatalf("Error reading bucket:  %v", err)
	}
	return b
}

func (ds *DataSource) QueryView(b *couchbase.Bucket, view string,
	params map[string]interface{}) []couchbase.ViewRow {
	params["stale"] = "update_after"
	vr, err := b.View(ds.Bucket, view, params)
	if err != nil {
		log.Println(err)
		ds.installBucketDDocs()
	}
	return vr.Rows
}

func (ds *DataSource) installBucketDDocs() {
	b := ds.GetBucket()

	err := b.PutDDoc(ds.Bucket, viewspec)
	if err != nil {
		log.Fatalf("%v", err)
	}
}

var TIMELINE_SIZE = 40

var VIEW = map[string]int{
	"absPassed": 0,
	"absFailed": 1,
	"priority":  2,
	"name":      3,
	"result":    4,
	"url":       5,
	"bid":       6,
}

var REDUCE = map[string]int{
	"absPassed": 0,
	"absFailed": 1,
	"relPassed": 2,
	"relFailed": 3,
}

type MapBuild struct {
	Version  string
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
	Total    float64
	Priority string
	Name     string
	Result   string
	Url      string
	Bid      float64
	Version  string
	Platform string
	Category string
}

type ReduceBuild struct {
	Version     string
	AbsPassed   float64
	AbsFailed   float64
	RelPassed   float64
	RelFailed   float64
	RelExecuted float64
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

func (api *Api) GetJobs(ctx *web.Context) []byte {

	ds := api.DataSourceFromCtx(ctx)
	b := ds.GetBucket()

	var version string
	for k, v := range ctx.Params {
		if k == "build" {
			version = v
		}
	}
	params := map[string]interface{}{
		"start_key": []interface{}{version},
		"end_key":   []interface{}{version + "_"},
		"reduce":    false,
		"stale":     "update_after",
	}

	jobs := []Job{}
	rows := ds.QueryView(b, "data_by_build", params)
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

func (ds *DataSource) UpdateJobsByVersion() {

	for version, _ := range ds.AllVersions {
		ds.JobsByVersion[version] = ds.GetNumJobsByVersion(version)
	}
}

func (api *Api) GetMissingJobs(ctx *web.Context) []byte {

	ds := api.DataSourceFromCtx(ctx)
	var build string
	for k, v := range ctx.Params {
		if k == "build" {
			build = v
		}
	}

	version := strings.Split(build, "-")[0]
	missingJobs := []Job{}

	// make sure jobs exists for this version
	if _, ok := ds.JobsByVersion[version]; ok {
		allJobs := ds.GetAllJobsByVersion(version)
		buildJobs := ds.GetAllJobsByBuild(build)
		for key, job := range allJobs {
			if _, ok := buildJobs[key]; !ok {
				// missing
				missingJobs = append(missingJobs, job)
			}
		}
	}

	j, _ := json.Marshal(missingJobs)
	return j
}

func (ds *DataSource) JobsFromRows(rows []couchbase.ViewRow) map[string]Job {

	uniqJobs := make(map[string]Job)
	for _, row := range rows {
		value := row.Value.([]interface{})
		name := value[0].(string)
		platform := value[1].(string)
		category := value[2].(string)
		url := value[3].(string)
		priority := value[4].(string)

		uniqJobs[name] = Job{
			0,
			0,
			priority,
			name,
			"NONE",
			url,
			-1,
			"",
			platform,
			category}

	}
	return uniqJobs
}

func (ds *DataSource) GetAllJobsByBuild(version string) map[string]Job {
	b := ds.GetBucket()

	params := map[string]interface{}{
		"key":           version,
		"inclusive_end": true,
		"stale":         "update_after",
		"reduce":        false,
	}
	log.Println(params)

	rows := ds.QueryView(b, "jobs_by_build", params)
	return ds.JobsFromRows(rows)
}

func (ds *DataSource) GetAllJobsByVersion(version string) map[string]Job {

	b := ds.GetBucket()

	params := map[string]interface{}{
		"start_key": version,
		"end_key":   version + "z",
		"stale":     "update_after",
		"reduce":    false,
	}
	log.Println(params)

	rows := ds.QueryView(b, "jobs_by_build", params)
	return ds.JobsFromRows(rows)

}

func (ds *DataSource) GetNumJobsByVersion(version string) float64 {

	jobs := ds.GetAllJobsByVersion(version)
	return float64(len(jobs))

}

func (ds *DataSource) GetAllJobsByBuilds() map[string]float64 {

	params := map[string]interface{}{
		"group_level": 1,
	}

	b := ds.GetBucket()
	rows := ds.QueryView(b, "jobs_by_build", params)

	res := make(map[string]float64)
	for _, row := range rows {
		res[row.Key.(string)] = row.Value.(float64)
	}
	return res
}

func (api *Api) GetBreakdown(ctx *web.Context) []byte {

	ds := api.DataSourceFromCtx(ctx)
	b := ds.GetBucket()
	version := "3.0"

	for k, v := range ctx.Params {
		if k == "build" {
			version = v
		}
	}
	params := map[string]interface{}{
		"start_key":   []interface{}{version},
		"end_key":     []interface{}{version + "_"},
		"group_level": 3,
	}
	rows := ds.QueryView(b, "data_by_build", params)

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
		passed, ok := value[REDUCE["absPassed"]].(float64)
		if !ok {
			continue
		}
		version := meta[0].(string)
		platform := meta[1].(string)
		category := meta[2].(string)
		if strings.Contains(strings.ToUpper(version), "XX") {
			continue
		}
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

func (ds *DataSource) SetBucket(ctx *web.Context) []byte {
	if b, ok := ctx.Params["bucket"]; ok {
		ds.BootStrap(b)
		return []byte(b)
	}
	return nil
}

func (api *Api) GetTimeline(ctx *web.Context) []byte {

	var start_key string
	var end_key string
	for k, v := range ctx.Params {
		if k == "start_key" {
			start_key = v
		}
		if k == "end_key" {
			end_key = v
		}
	}

	ds := api.DataSourceFromCtx(ctx)
	return ds._GetTimeline(start_key, end_key)
}

func (ds *DataSource) _GetTimeline(start_key string, end_key string) []byte {

	if start_key == "" {
		start_key = " "
	}
	if end_key == "" {
		end_key = "9999"
	}

	b := ds.GetBucket()
	params := map[string]interface{}{
		"start_key":     []interface{}{start_key},
		"end_key":       []interface{}{end_key},
		"inclusive_end": true,
		"stale":         "update_after",
		"group_level":   1,
	}
	log.Println(params)

	rows := ds.QueryView(b, "data_by_build", params)
	jobsByBuild := ds.GetAllJobsByBuilds()

	/***************** Query Reduce Views*****************/
	reduceBuild := []ReduceBuild{}
	for _, row := range rows {
		rowKey := row.Key.([]interface{})
		version := rowKey[0].(string)
		if strings.Contains(strings.ToUpper(version), "XX") {
			continue
		}

		versionMain := strings.Split(version, "-")[0]
		var validID = regexp.MustCompile("[0-9]$")
		if !validID.MatchString(versionMain) {
			log.Println("skip:" + versionMain)
			continue
		}
		ds.AllVersions[versionMain] = true
		if _, ok := ds.JobsByVersion[versionMain]; !ok {
			// get job totals for version
			ds.JobsByVersion[versionMain] = ds.GetNumJobsByVersion(versionMain)
		}

		value := row.Value.([]interface{})
		relExecuted := 100 * (jobsByBuild[version] / ds.JobsByVersion[versionMain])

		reduceBuild = append(reduceBuild,
			ReduceBuild{
				version,
				value[REDUCE["absPassed"]].(float64),
				value[REDUCE["absFailed"]].(float64),
				value[REDUCE["relPassed"]].(float64),
				value[REDUCE["relFailed"]].(float64),
				relExecuted,
			})
	}

	j, _ := json.Marshal(reduceBuild)
	return j
}

func (api *Api) GetVersions(ctx *web.Context) []byte {
	ds := api.DataSourceFromCtx(ctx)
	j, _ := json.Marshal(ds.AllVersions)
	return j
}

/*func (ds *DataSource) GetMobileVersions() []byte {
	client := github.NewClient(nil)
	if client != nil {
		tags, _, err := client.Repositories.ListTags("couchbase", "couchbase-lite-ios", nil)
		if err == nil {
			for _, t := range tags {
				var tname = *t.Name
				var validTag = regexp.MustCompile(`^[0-9](\.[0-9]+)+$`)
				if validTag.MatchString(tname) {
					log.Println(tname)
					ds.MobileVersions[tname] = true
				} else {
					log.Println("skip version:" + tname)
				}

			}
		} else {
			log.Println(err)
		}
	}
	j, _ := json.Marshal(ds.MobileVersions)
	return j
}*/

func (ds *DataSource) BootStrap(bucket string) {
	ds.AllVersions = make(map[string]bool)
	ds.JobsByVersion = make(map[string]float64)
	ds.Bucket = bucket
	ds._GetTimeline("", "")
	log.Println("Loading bucket: " + bucket)
}

func (api *Api) DataSourceFromCtx(ctx *web.Context) *DataSource {

	var ds *DataSource

	if b, ok := ctx.Params["bucket"]; ok {
		ds = api.DataSources[b]
	} else {
		ds = api.DataSources["server"]
	}
	return ds
}

func (api *Api) GetIndex(ctx *web.Context) []byte {
	ds := api.DataSourceFromCtx(ctx)
	go ds.UpdateJobsByVersion()
	content, _ := ioutil.ReadFile(pckgDir + "app/index.html")
	return content
}

func DataSourceForBucket(bucket string, couchbaseAddress string) *DataSource {
	ds := new(DataSource)
	ds.CouchbaseAddress = couchbaseAddress
	ds.BootStrap(bucket)
	return ds
}

func (api *Api) AddDataSource(bucket string) {
	if _, ok := api.DataSources[bucket]; !ok {
		api.DataSources[bucket] = DataSourceForBucket(bucket, api.CouchbaseAddress)
	}
}
