

import { PrefixQuery } from './Queries/PrefixQuery';
import { BTreePrefixQuery } from './Queries/BTreePrefixQuery';
import { WKTStringQuery } from './Queries/WKTStringQuery';
import { AutocompleteClient } from './Clients/AutocompleteClient';
import { WKTClient } from './Clients/WKTClient';
import { BTreeQuery } from './Queries/BTreeQuery';
import { BTreeClient } from './Clients/BTreeClient';

const fs = require("fs")

async function main(){
  // let shaclpath = ["http://xmlns.com/foaf/0.1/name"];
  // let shaclpath = ["https://data.vlaanderen.be/ns/adres#positie", "http://www.opengis.net/ont/geosparql#asWKT"]
  let shaclpath = ["http://www.w3.org/2000/01/rdf-schema#label"];
  // let shaclpath = ["https://data.vlaanderen.be/ns/adres#huisnummer"]
  let maxamount = 50;
  
  let client = new AutocompleteClient()
  let collectionUrl = "http://193.190.127.164/stopsbtreetest/25/node0.jsonld#Collection"
  // let collectionUrl = "http://193.190.127.164/streetdata/prefix/25/node0.jsonld#Collection"
  // let collectionUrl = "http://193.190.127.164/streetsbtreetest/100/node0.jsonld#Collection"
  // let collectionUrl = "http://193.190.127.164/btreetest/25/node0.jsonld#Collection"
  // let collectionUrl = "http://193.190.127.164/locationdata25/node0.jsonld#Collection"

  // let collectionUrl = "http://193.190.127.164/addressdata/44021/71597/node0.jsonld#Collection"
  
  let cch = 0;
  let ccm = 0;
  let sch = 0;
  let scm = 0
  let bdw = 0;
  let yesq = 0;
  let noq = 0;

  client.on("client-cache-miss", (obj:any) => {
    ccm += 1;
    printstats()
  }) 
  client.on("client-cache-hit", (obj:any) => {
    cch += 1;
    printstats()
  }) 
  client.on("server-cache-miss", (obj:any) => {
    scm += 1;
    printstats()
  }) 
  client.on("server-cache-hit", (obj:any) => {
    sch += 1;
    printstats()
  }) 
  client.on("downloaded", (obj:any) => {
    bdw += obj.totalBytes;
    printstats()
  }) 
  client.on("querystats", (obj:any) => {
    if ( obj.fulfilled === true){yesq += 1}
    else {noq += 1}

  })

  client.on("data", (data: any) =>{
    // console.log("data", data)
  });

  client.on("member", (member: any) =>{
    console.log("member", member)
  });

  client.on("efficiency", (data: any) =>{
    // console.log("efficiency", data)
  });
  
  let straatNamen = fs.readFileSync("straatnamen.txt").toString().split("\n")
  // for (let prefix of ["S", "Si", "Sin", "Sint", "Sint-", "Sint-D", "Sint-Denijsl", "Sint-Denijslaan", "Sint-Denijslaanweg", "Br", "Brus", "Brussel", "brusselse", "Test", "heer", "o", "oo", "oost"]){
  console.time("running")

  let prefix = "Molenstraat"
  // let prefix = "POLYGON((3.7109756469726562 51.05499153525915,3.7322616577148433 51.05391250354427,3.7326049804687496 51.04139389812639,3.7109756469726562 51.04096216172971,3.7109756469726562 51.05499153525915))"
  // console.log(prefix)
  // let prefix = "78"
  // await client.query(prefix, PrefixQuery, shaclpath, collectionUrl)
  let usedRelation = BTreePrefixQuery

  /*let [query, queryTask] = */client.query(prefix, usedRelation, shaclpath, collectionUrl, 25)
  

  // await new Promise(resolve => setTimeout(resolve, 10));  // Wait 0.1 second to simulate a keypress

  await client.await_running_queries()
  
  console.timeEnd("running")

  function printstats(){
    // console.log(ccm, cch, scm, sch, bdw, yesq, noq)
  }






  
}


main();