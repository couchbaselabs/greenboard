package main

import (
    "log"
    "encoding/json"
    "io/ioutil"
    "net/http"
    "net/url"
    "time"
    "github.com/couchbaselabs/go-couchbase"
    "github.com/couchbase/gomemcached/client"
    "fmt"
)


type Doc struct{
    meta  map[string]string
}

type Config struct {
    CouchbaseAddress, ListenAddress string
}



func jobPurger(couchbaseAddress string){
    defer func() {
	if r :=  recover(); r != nil {
		fmt.Printf("Recovered from panic: %v", r)
	}
    }()
    client, _ := couchbase.Connect(couchbaseAddress)
    pool, _ := client.GetPool("default")

    params := map[string]interface{}{
	"reduce": false,
    }

    bucket := "server"

    mc, err := memcached.Connect("tcp","172.23.121.132:11210")
    _, err = mc.Auth(bucket, "")
    if err != nil {
        log.Fatal(err)
    }

    // query bucket
    b, err := pool.GetBucket(bucket)
    if err != nil {
        log.Fatalf("Error reading bucket:  %v", err)
    }

    vr, err := b.View("server", "jobs_by_build", params)
    if err != nil {
        log.Println(err)
    }
    for _, row := range vr.Rows {
        vals := row.Value.([]interface{})
	if len(vals) < 7 {
		continue
	}
	jobUrl := vals[3].(string)
	//log.Println("Processing: " +jobUrl)
	resp, _ := http.Get(jobUrl)
	if resp.StatusCode == 200 {
           resp.Body.Close()  
	   continue
       	}

       if resp.StatusCode == 404 {
           // make sure 404 is not because jenkins is down
          parsedUrl , _:= url.Parse(jobUrl)
          resp, _ = http.Get(parsedUrl.Scheme+"://"+parsedUrl.Host)
          if resp != nil && resp.StatusCode != 200 {
              log.Println("Jenkins down! skipping: "+jobUrl)
              continue
          }
	  resp.Body.Close()

          log.Println("Purging: "+jobUrl)
          id := row.ID 
          // TODO: using dirty workaround until keys are in correct vbuckets
          _, err = mc.Get(0, id)
          if err == nil {
              _, err = mc.Del(0, id)
              if err != nil {
                  log.Fatal(err)
              }
         }
        }
    }
    mc.Close()
}

func main(){
    configFile, err := ioutil.ReadFile("config.json")
    if err != nil {
        log.Fatal(err)
    }

    var config Config
    err = json.Unmarshal(configFile, &config)
    if err != nil {
        log.Fatal(err)
    }

    for true { // ever
        log.Println("Running job Purger")
        jobPurger(config.CouchbaseAddress)
	log.Println("Sleeping for 30 mins before next run")
	time.Sleep(30*time.Minute)
    }

}
