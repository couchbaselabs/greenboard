package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"

	"github.com/hoisie/web"
)

var pckgDir string

var data_source DataSource

func index() []byte {
	content, _ := ioutil.ReadFile(pckgDir + "app/index.html")
	return content
}

type Config struct {
	CouchbaseAddress, ListenAddress, Release string
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

	data_source = DataSource{config.CouchbaseAddress, config.Release}
	web.Get("/", index)
	web.Get("/timeline", data_source.GetTimeline)
	web.Get("/breakdown", data_source.GetBreakdown)
	web.Get("/jobs", data_source.GetJobs)
	web.Run(config.ListenAddress)
}
