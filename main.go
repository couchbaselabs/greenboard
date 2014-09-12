package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"github.com/hoisie/web"
)

var pckgDir string

var data_source *DataSource



type Config struct {
	CouchbaseAddress, ListenAddress, Release string
}

func main() {
	pckgDir = os.Getenv("GOPATH") + "/src/github.com/tahmmee/greenboard-ng/"
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

	data_source = new(DataSource)
        data_source.CouchbaseAddress = config.CouchbaseAddress
        data_source.Release = config.Release
        data_source.BootStrap()
	web.Get("/", data_source.GetIndex)
	web.Get("/timeline", data_source.GetTimeline)
	web.Get("/breakdown", data_source.GetBreakdown)
	web.Get("/jobs", data_source.GetJobs)
	web.Get("/versions", data_source.GetAllVersions)
	web.Run(config.ListenAddress)
}
