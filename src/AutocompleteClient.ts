import { EventEmitter } from "events";
import { Parser } from './Parser';
const fs = require("fs")

const PromiseQueue = require("easy-promise-queue").default;
const normalizeString = function(e:string) {return e.toLowerCase()}

export class AutocompleteClient extends EventEmitter{
  
  private parser: any;
  private previousQuery : any = null;

  private queryqueue: any;
  private MAXAMOUNT: number;

  constructor(maxamount: number, shaclpath: string){
    super();
    this.parser = new Parser();
    
    this.parser.on("client-cache-miss", (obj:any) => {
      this.emit("client-cache-miss", obj)
    }) 
    this.parser.on("client-cache-hit", (obj:any) => {
      this.emit("client-cache-hit", obj)
    }) 
    this.parser.on("server-cache-miss", (obj:any) => {
      this.emit("server-cache-miss", obj)
    }) 
    this.parser.on("server-cache-hit", (obj:any) => {
      this.emit("server-cache-hit", obj)
    }) 
    this.parser.on("downloaded", (obj:any) => {
      this.emit("downloaded", obj)
    }) 

    this.queryqueue = new PromiseQueue({concurrency: 1});
    this.MAXAMOUNT = maxamount

  }

  async query(searchvalue: string, queryClass : any, shaclpath: string, queryURL: any){
    console.log("SEARCH:", searchvalue)

    let prevqueryprops = await this.previousQuery;
    // console.log("previous query props", prevqueryprops)
  

    let MAXAMOUNT = this.MAXAMOUNT
    let parser = this.parser;
    let emittedItems = 0;

    let query = new queryClass(parser, queryURL);



    if ( prevqueryprops !== null && ! (prevqueryprops["searchvalue"] === null || ! searchvalue.startsWith(prevqueryprops["searchvalue"]) || searchvalue.length < prevqueryprops["session"].length ) ){
      for (let quad of prevqueryprops["items"]){
        if (normalizeString(quad.object.value).startsWith(normalizeString(searchvalue))){
          if (emittedItems < MAXAMOUNT){
            this.emit("data", {data: quad, searchvalue: searchvalue, count: emittedItems})
            emittedItems += 1;
          }
        }
      }
    }

    
    query.on("data", (data: any) => {
      for(let quad of data.quads){
        if (emittedItems < MAXAMOUNT){
          if (quad.predicate.value === shaclpath && normalizeString(quad.object.value).startsWith(normalizeString(searchvalue))){
            this.emit("data", {data: quad, searchvalue: searchvalue, count: emittedItems})
            emittedItems += 1;
          }
        }
      }
    });


    this.queryqueue.add(() => {
      let newQuery = new Promise(async function (resolve, reject) {
        let currentItems = new Array();
        let currentSession: any = null;
        
        if ( prevqueryprops !== null && ! (prevqueryprops["searchvalue"] === null || ! searchvalue.startsWith(prevqueryprops["searchvalue"]) || searchvalue.length < prevqueryprops["searchvalue"].length ) ){
          for (let quad of prevqueryprops["items"]){
            if (normalizeString(quad.object.value).startsWith(normalizeString(searchvalue))){
              currentItems.push(quad);
            }
          }
          currentSession = await prevqueryprops["session"];
        }
    
    
        let currentItemsMap = currentItems.map(e => e.subject.value)
    
        if (currentItems.length < MAXAMOUNT){
          query.on("data", (data: any) => {
            for(let quad of data.quads){
              if (quad.predicate.value === shaclpath && normalizeString(quad.object.value).startsWith(normalizeString(searchvalue))){
                if (currentItemsMap.indexOf(quad.subject.value === -1)){
                  currentItems.push(quad)
                  if (currentItems.length >= MAXAMOUNT){
                    query.interrupt();
                  }
                }
              }
            }
          })
          console.log("QUERY NEW QUERY", searchvalue)
          query.query(queryURL, searchvalue, currentSession).then( (resultsession: any) => {
            let resultObject = {
              "session": resultsession,
              "items": currentItems,
              "searchvalue": searchvalue,
              "fulfilled": false
            }
            resolve(resultObject)
          }).catch( (error: any) => {
            let resultObject = {
              "session": null,
              "items": currentItems,
              "searchvalue": searchvalue,
              "fulfilled": false
            }
            resolve(resultObject)
          })
        } else {
          console.log("already fulfilled")
          let resultObject = {
            "session": currentSession,
            "items": currentItems,
            "searchvalue": searchvalue,
            "fulfilled": true
          } 
          resolve(resultObject)
        }
      })
      this.previousQuery = newQuery;
      newQuery.then((resultObject:any) => {
        this.emit("neededquery", resultObject.fulfilled)
      })
      return newQuery; 
    });
    
  }

}