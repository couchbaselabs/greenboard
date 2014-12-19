package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"

	"github.com/hoisie/web"
)

var pckgDir string

var api *Api

type Config struct {
	CouchbaseAddress, ListenAddress string
}

func main() {
	pckgDir = os.Getenv("GOPATH") + "/src/github.com/tahmmee/greenboard/"
	web.Config.StaticDir = pckgDir + "app"

	configFile, err := ioutil.ReadFile(pckgDir + "config.json")
	if err != nil {
		log.Fatal(err)
	}

	var config Config
	err = json.Unmarshal(configFile, &config)
	if err != nil {
		log.Fatal(err)
	}

    // start jenkins maintenance thread
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
	web.Get("/jobs_missing", api.GetMissingJobs)
	web.Run(config.ListenAddress)
}
