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
				"map": "function(doc, meta){ emit([doc.build, doc.os, doc.component], [doc.totalCount - doc.failCount,doc.failCount,  doc.priority, doc.name, doc.result, doc.url, doc.build_id, doc.duration]);}",
                                "reduce" : "function (key, values, rereduce) { var fAbs = 0; var pAbs = 0; for(i=0;i < values.length; i++) { pAbs = pAbs + values[i][0]; fAbs = fAbs + values[i][1]; } var total = fAbs + pAbs; var pRel = 100.0*pAbs/total; var fRel = 100.0*fAbs/total; return ([pAbs, fAbs, pRel, fRel]); }"
            },
			"jobs_by_build": {
				"map": "function(doc, meta){ emit(doc.build, [doc.name, doc.os, doc.component, doc.url, doc.priority, doc.totalCount, doc.build_id, doc.duration]);}",
				"reduce": "_count"
			},"all_components": {
				"map": "function(doc, meta){ emit(doc.component, null);}",
				"reduce": "_count"
			},"all_platforms": {
				"map": "function(doc, meta){ emit(doc.os, null);}",
				"reduce": "_count"
			}
		}
	}`

type DataSource struct {
	CouchbaseAddress   string
	Bucket             string
	AllVersions        map[string]bool
	JobsByVersion      map[string]map[string]Job
	JobsByBuild        map[string]map[string]Job
	JobsMissingByBuild map[string][]Job
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
	"duration":  7,
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
	Pending  float64
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
	Duration float64
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
			var duration float64
			if len(value)==8 && value[7] != nil {
				duration = value[7].(float64)
			} else {
				duration = 0
			}

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
				duration,
			})
		}
	}

	j, _ := json.Marshal(jobs)
	return j
}

func (ds *DataSource) UpdateJobs(stale_ok bool) {

	// update all jobs belonging to a version
	for version, _ := range ds.AllVersions {
		ds.JobsByVersion[version] = ds.GetAllJobsByVersion(version, stale_ok)
	}
}

func (ds *DataSource) _GetMissingJobs(build string) []Job {

	missingJobs := []Job{}

	buildJobs := ds.GetAllJobsByBuild(build, true)
	uniqJobs := make(map[string]Job)

	build_v := strings.Split(build, "-")[0]
	// only pick up jobs <= version applicable for this build
	for v, versionJobs := range ds.JobsByVersion {
		if v > build_v {
			continue
		}


		for key, job := range versionJobs {
			if _, ok := buildJobs[key]; !ok { // job missing
				// block 4.0 xdcr jobs
				if(build_v > "3.5"){
					if(job.Category == "XDCR"){
						continue
					}
				}
				if job.Bid < uniqJobs[key].Bid {
					continue // skip not latest
				}
				uniqJobs[key] = job
			}
		}
	}

	for _, job := range uniqJobs { // to array
		missingJobs = append(missingJobs, job)
	}

	ds.JobsMissingByBuild[build] = missingJobs

	return missingJobs

}

func (api *Api) GetMissingJobs(ctx *web.Context) []byte {

	ds := api.DataSourceFromCtx(ctx)
	var build string
	for k, v := range ctx.Params {
		if k == "build" {
			build = v
		}
	}
	if _, ok := ds.JobsMissingByBuild[build]; !ok {
		ds.GetAllJobsByBuild(build, false)
		ds._GetMissingJobs(build)
	}

	j, _ := json.Marshal(ds.JobsMissingByBuild[build])
	// update jobs by build cache
	go ds.GetAllJobsByBuild(build, false)
	go ds._GetMissingJobs(build)
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
		total := value[5].(float64)
		bid := value[6].(float64)

		var duration float64
		if len(value)==8 && value[7] != nil {
			duration = value[7].(float64)
		} else {
			duration = 0
		}

		if _, ok := uniqJobs[name]; ok { // job exists
			if bid < uniqJobs[name].Bid { // if this is older
				continue // skip
			}
		}
		uniqJobs[name] = Job{
			0,
			total,
			priority,
			name,
			"NONE",
			url,
			bid,
			"",
			platform,
			category,
			duration}

	}
	return uniqJobs
}

func (ds *DataSource) GetAllJobsByBuild(version string, stale_ok bool) map[string]Job {
	b := ds.GetBucket()

	if stale_ok == true {
		if _, ok := ds.JobsByBuild[version]; ok {
			// update and return cached
			return ds.JobsByBuild[version]
		}
	}

	params := map[string]interface{}{
		"key":           version,
		"inclusive_end": true,
		"stale":         "update_after",
		"reduce":        false,
	}
	log.Println(params)

	rows := ds.QueryView(b, "jobs_by_build", params)
	ds.JobsByBuild[version] = ds.JobsFromRows(rows)

	return ds.JobsByBuild[version]
}

func (ds *DataSource) GetAllJobsByVersion(version string, stale_ok bool) map[string]Job {

	b := ds.GetBucket()

	if stale_ok == true {
		if _, ok := ds.JobsByVersion[version]; ok {
			// update and return cached
			return ds.JobsByVersion[version]
		}
	}

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
	return float64(len(ds.JobsByVersion[version]))
}

func (ds *DataSource) GetNumJobsByBuild(version string) float64 {
	return float64(len(ds.JobsByBuild[version]))
}

func (api *Api) GetBreakdown(ctx *web.Context) []byte {

	ds := api.DataSourceFromCtx(ctx)
	b := ds.GetBucket()
	build := "3.0"

	for k, v := range ctx.Params {
		if k == "build" {
			build = v
		}
	}
	params := map[string]interface{}{
		"start_key":   []interface{}{build},
		"end_key":     []interface{}{build + "_"},
		"group_level": 3,
	}
	rows := ds.QueryView(b, "data_by_build", params)

	//   unlistedPlatforms := api.QueryAllView(ctx, "all_platforms")
	//   unlistedCategories := api.QueryAllView(ctx, "all_components")
	listedPlatforms := make(map[string]bool)
	listedCategories := make(map[string]bool)

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

		platform := meta[1].(string)
		category := meta[2].(string)
		if strings.Contains(strings.ToUpper(build), "XX") {
			continue
		}

		if (passed + failed) > 0 {
			// these are jobs that have actual results
			mapBuilds = append(mapBuilds, MapBuild{
				build,
				passed,
				failed,
				0,
				category,
				platform,
				"na",
			})
		}
		listedPlatforms[platform] = true
		listedCategories[category] = true
	}

	// append jobs with no results for this build as pending
	if _, ok := ds.JobsMissingByBuild[build]; !ok {
		ds._GetMissingJobs(build)
	}
	allJobs := ds.JobsMissingByBuild[build]

	for _, job := range allJobs {
		mapBuilds = append(mapBuilds, MapBuild{
			build,
			0,
			0,
			job.Total, // total from missing job = pending
			job.Category,
			job.Platform,
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

func (api *Api) GetCategories(ctx *web.Context) []byte {

	results := map[string][]string{}
	results["platforms"] = api.QueryAllView(ctx, "all_platforms")
	results["components"] = api.QueryAllView(ctx, "all_components")
	j, _ := json.Marshal(results)
	return j
}

func (api *Api) QueryAllView(ctx *web.Context, view string) []string {
	ds := api.DataSourceFromCtx(ctx)
	b := ds.GetBucket()

	params := map[string]interface{}{
		"group_level": 1,
	}

	li := []string{}

	rows := ds.QueryView(b, view, params)
	for _, row := range rows {
		item := row.Key.(string)
		li = append(li, item)
	}
	return li
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
			ds.UpdateJobs(true)
		}
		nJobsByBuild := ds.GetNumJobsByBuild(version)
		nJobsByVersion := ds.GetNumJobsByVersion(versionMain)

		value := row.Value.([]interface{})
		relExecuted := nJobsByVersion - nJobsByBuild

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

func (ds *DataSource) BootStrap(bucket string) {
	ds.AllVersions = make(map[string]bool)
	ds.JobsByVersion = make(map[string]map[string]Job)
	ds.JobsByBuild = make(map[string]map[string]Job)
	ds.JobsMissingByBuild = make(map[string][]Job)
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
	ds.UpdateJobs(false)
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
