package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"github.com/hoisie/web"
)

var pckgDir string

var api *Api

type Config struct {
	CouchbaseAddress, ListenAddress, StaticDir string
}

func main() {

	configFile, err := ioutil.ReadFile("config.json")
	if err != nil {
		log.Fatal(err)
	}

	var config Config
	err = json.Unmarshal(configFile, &config)
	if err != nil {
		log.Fatal(err)
	}

	web.Config.StaticDir = config.StaticDir

    // start web api 
	api = new(Api)
	api.CouchbaseAddress = config.CouchbaseAddress
	api.DataSources = make(map[string]*DataSource)
	api.AddDataSource("server")
	api.AddDataSource("mobile")
	api.AddDataSource("sdk")

	web.Get("/", api.GetIndex)
	web.Get("/timeline", api.GetTimeline)
	web.Get("/breakdown", api.GetBreakdown)
	web.Get("/jobs", api.GetJobs)
	web.Get("/versions", api.GetVersions)
	web.Get("/categories", api.GetCategories)
	web.Get("/jobs_missing", api.GetMissingJobs)
	web.Run(config.ListenAddress)
}
