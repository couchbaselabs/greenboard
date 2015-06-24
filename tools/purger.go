package main

import (
    "os"
    "log"
    "encoding/json"
    "io/ioutil"
    "net/http"
    "net/url"
    "time"
    "github.com/couchbaselabs/go-couchbase"
    "github.com/couchbase/gomemcached/client"
)


type Doc struct{
    meta  map[string]string
}

type Config struct {
    CouchbaseAddress, ListenAddress string
}



func jobPurger(couchbaseAddress string){

    client, _ := couchbase.Connect(couchbaseAddress)
    pool, _ := client.GetPool("default")

    params := map[string]interface{}{
        "reduce":    false,
        "include_docs": true,
        "stale":     "false",
    }
    bucket := "server"

    mc, err := memcached.Connect("tcp","127.0.0.1:11210")
    _, err = mc.Auth(bucket, "")
    if err != nil {
        log.Fatal(err)
    }

    // query bucket
    b, err := pool.GetBucket(bucket)
    if err != nil {
        log.Fatalf("Error reading bucket:  %v", err)
    }
    vr, err := b.View(bucket, "data_by_build", params)
    if err != nil {
        log.Println(err)
    }
    for _, row := range vr.Rows {
        vals := row.Value.([]interface{})
        jobUrl := vals[5].(string)
        resp, _ := http.Head(jobUrl)
       if resp == nil {
           continue
       }

       if resp.StatusCode == 404 {
           // make sure 404 is not because jenkins is down
          parsedUrl , _:= url.Parse(jobUrl)
          resp, _ = http.Head(parsedUrl.Scheme+"://"+parsedUrl.Host)
          if resp != nil && resp.StatusCode != 200{
              log.Println("Jenkins down! skipping: "+jobUrl)
              continue
          }


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
}

func main(){

    pckgDir := os.Getenv("GOPATH") + "/src/github.com/tahmmee/greenboard/"
    configFile, err := ioutil.ReadFile(pckgDir + "config.json")
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
        time.Sleep(30*time.Minute)
    }

}
