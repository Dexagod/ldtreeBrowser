import { EventEmitter } from "events";
import { Parser } from './Parser';

const PromiseQueue = require("easy-promise-queue").default;
const normalizeString = function(e:string) {return e.toLowerCase()}

export class AutocompleteClientParrallel extends EventEmitter{
  
  private parser: any;
  private previousQueryResponse : any = null;

  private previousQuery : any = null;

  private allItems = new Set();
  private usedItems = new Set();

  private queryqueue: any;
  private queryPromiseMap = new Map();
  private currentQueryIndex=0;

  private MAXAMOUNT: number;

  private queryTasks : number;

  constructor(maxamount: number, shaclpath: string, activeQueries = 1, queryTasks=1){
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

    this.queryqueue = new PromiseQueue({concurrency: activeQueries});
    this.MAXAMOUNT = maxamount
    this.queryTasks = queryTasks;

  }

  async query(searchvalue: string, queryClass : any, shaclpath: string, queryURL: any, awaitPreviousQuery: boolean = false){
    

    let query = new queryClass(this.parser, queryURL, this.queryTasks);

    let prevquery = this.previousQuery;
    this.previousQuery = query;

    if (awaitPreviousQuery && prevquery != null) {
      prevquery.on("result", function(result : any) {
        executeQuery(query, searchvalue, shaclpath, result)
      })
    } else {
      this.executeQuery(query, searchvalue, shaclpath, null)
    }
      
    
  }

  executeQuery(query : any, searchvalue: any, shaclpath: string, prevqueryprops: any){

    let MAXAMOUNT = this.MAXAMOUNT
    let emittedItems = 0;

    console.log("PREVSESSIONPROPS", prevqueryprops)
    if ( prevqueryprops !== null && prevqueryprops !== undefined && ! (prevqueryprops["searchvalue"] === null || ! searchvalue.startsWith(prevqueryprops["searchvalue"]) || searchvalue.length < prevqueryprops["session"].length ) ){
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

  await this.queryqueue.add(() => {
    let newQueryResponse = new Promise(async function (resolve, reject) {
      let allItems = new Set();
      let usedItems = new Set();

      let currentItems = new Array();
      let currentSession: any = null;
      
      if ( prevqueryprops !== null && ! (prevqueryprops["searchvalue"] === null || ! searchvalue.startsWith(prevqueryprops["searchvalue"]) || searchvalue.length < prevqueryprops["searchvalue"].length ) ){
        for (let quad of prevqueryprops["items"]){
          if (normalizeString(quad.object.value).startsWith(normalizeString(searchvalue))){
            currentItems.push(quad);
          }
        }
        currentSession = await prevqueryprops["session"];
        console.log("PREVSESSIONQUERY", currentSession)
      } else {
        console.log("NOPREVSESSION", prevqueryprops === null)
      }
  
  
      let currentItemsMap = currentItems.map(e => e.subject.value)
  
      if (currentItems.length < MAXAMOUNT){
        query.on("data", (data: any) => {
          let usefullIds = []
          for(let quad of data.quads){
            if (quad.predicate.value === shaclpath && normalizeString(quad.object.value).startsWith(normalizeString(searchvalue))){
              usefullIds.push(quad.subject.value)
              if (currentItemsMap.indexOf(quad.subject.value === -1)){
                currentItems.push(quad)
                if (currentItems.length >= MAXAMOUNT){
                  query.interrupt();
                }
              }
            }
          }

          for(let quad of data.quads){
            allItems.add(quad.subject.value)
            if (usefullIds.indexOf(quad.subject.value) !== -1){
              usedItems.add(quad.subject.value)
            }
          }
        })
        query.query(queryURL, searchvalue, currentSession).then( (resultsession: any) => {
          let resultObject = {
            "session": resultsession,
            "items": currentItems,
            "searchvalue": searchvalue,
            "fulfilled": false,
            "useditems": usedItems,
            "allitems": allItems,
          }
          resolve(resultObject)
        }).catch( (error: any) => {
          let resultObject = {
            "session": null,
            "items": currentItems,
            "searchvalue": searchvalue,
            "fulfilled": false,
            "useditems": usedItems,
            "allitems": allItems,
          }
          resolve(resultObject)
        })
      } else {
        let resultObject = {
          "session": currentSession,
          "items": currentItems,
          "searchvalue": searchvalue,
          "fulfilled": true,
          "useditems": usedItems,
          "allitems": allItems,
        } 
        resolve(resultObject)
      }
    })
    // this.previousQueryResponse = newQueryResponse;
    // this.queryPromiseMap.set(queryIndex, newQueryResponse)
    // console.log("SETTING QUERY RESPONSE", queryIndex)
    newQueryResponse.then((resultObject:any) => {
      this.allItems = new Set([...this.allItems, ...resultObject.allitems])
      this.usedItems = new Set([...this.usedItems, ...resultObject.useditems])
      this.emit("querystats", 
      {
        fulfilled: resultObject.fulfilled,
        useditems: this.usedItems.size,
        allitems: this.allItems.size
      })
    })
    return newQueryResponse; 
  });
  }

  awaitFinish(){
    let queryqueue = this.queryqueue
    return new Promise(async function (resolve, reject) {
      queryqueue.add(() => {
        return new Promise(async function (resolve, reject) {
          resolve()
        }).then( (e:any) => { resolve() } );
      })
    })
  }

  interrupt(){
    if (this.previousQuery !== null){
      this.previousQuery.interrupt()
    }
  }

}