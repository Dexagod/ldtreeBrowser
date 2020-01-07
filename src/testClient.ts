

import { AutocompleteClient } from './AutocompleteClient';
import { PrefixQuery } from './Queries/PrefixQuery';
import { BTreePrefixQuery } from './Queries/BTreePrefixQuery';

async function main(){
  let shaclpath = "http://xmlns.com/foaf/0.1/name";
  let maxamount = 50;
  
  let client = new AutocompleteClient(maxamount, shaclpath)
  // let collectionUrl = "http://193.190.127.164/stopsperfixtest/1000/node0.jsonld#Collection"
  let collectionUrl = "http://193.190.127.164/stopsbtreetest/100/node0.jsonld#Collection"
  
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
    let searchvalue = data.searchvalue;
    let quad = data.data;
    let count = data.count;
    console.log("prefix", searchvalue, "data", quad.object.value, quad.subject.value, count)
  });
  
  for (let prefix of ["S", "Si", "Sin", "Sint", "Sint-", "Sint-D", "Sint-Denijsl", "Sint-Denijslaan", "Sint-Denijslaanweg", "Br", "Brus", "Brussel", "brusselse", "Test", "heer", "o", "oo", "oost"]){
    // await client.query(prefix, PrefixQuery, shaclpath, collectionUrl)
    await client.query(prefix, BTreePrefixQuery, shaclpath, collectionUrl)
    
    await new Promise(resolve => setTimeout(resolve, 100));  // Wait 0.1 second to simulate a keypress
    client.interrupt()
  }

  function printstats(){
    console.log(ccm, cch, scm, sch, bdw, yesq, noq)
  }
}


main();