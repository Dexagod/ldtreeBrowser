import { EventEmitter } from "events";
import { Parser } from '../Parser';
import { Query } from '../Queries/Query';
import { QuadConverter } from './Converter/QuadConverer';

export abstract class Client extends EventEmitter{
  
  private parser: any;

  protected allItems = new Set();
  protected usedItems = new Set();

  private queryArray: any;

  constructor(){
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

    this.queryArray = new Array();

  }

  async query(searchvalue: string, queryClass : any, shaclpath: Array<string>, queryURL: any, maxamount: number) : Promise<any[]>{

    searchvalue = this.convertSearchValue(searchvalue)

    // let prevqueryprops = await this.previousQueryResponse;
    let parser = this.parser;

    let query = new queryClass(parser, queryURL);
    
    query.on("data", (data: any) => {
      this.handleEmitData(query, data, shaclpath, searchvalue, queryURL);
    });
    query.on("followedRelationValue", (value: any) => {
      this.emit("followedRelationValue", value)
    });

    this.queryArray.push(query)

    var queryTask = null;

    let newQueryResponse = new Promise(async function (resolve, reject) {
      let allItems = new Set();
      let usedItems = new Set();

      let currentItems = new Array();
      let currentSession: any = null;
      
      queryTask = query.query(queryURL, searchvalue, currentSession, maxamount)
      queryTask.then( (resultsession: any) => {
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
        console.error(error)
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
    })

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

    return [query, queryTask, newQueryResponse];
  }


  handleEmitData(query: Query, data: any, shaclpath: Array<string>, searchValue: any, collectionId: string) : void{
    let converter = new QuadConverter()
    converter.processQuads(data.quads)
    let collectionObjects = converter.getItemsForType("http://www.w3.org/ns/hydra/core#Collection").jsonld
    let collection = null;
    for (let collectionObject of collectionObjects){
      if (collectionObject["id"] === collectionId){
        collection = collectionObject
      }
    }


    let nodes = converter.getItemsForType("https://w3id.org/tree#Node").jsonld
    for (let node of nodes){
      this.emit("node", node)
    }

    if (collection === undefined || collection === undefined){ return; }
    let members = collection['http://www.w3.org/ns/hydra/core#member']
    if (members === undefined || members === undefined){ return; }

    for (let member of members){
      let memberresult = converter.getConnectedBlankNodesForId(converter.getIdOrValue(member))
      member = memberresult.jsonld
      let item = member;
      for (let property of shaclpath){
        if (item[property] === null || item[property] === undefined){
          break
        } else {
          item = item[property]
          if (Array.isArray(item))
          item = item[0]
        }
      }
      this.allItems.add(member["id"])
      item = converter.getIdOrValue(item)
      if (item !== null &&  item !== undefined && this.filterValue(item, searchValue)){
        this.usedItems.add(member["@id"])
        query.results += 1;
        this.emit("member", memberresult.jsonld)
        this.emit("data", memberresult.quads)

        // if (query.results > query.maxamount){ 
        //   query.interrupt();
        // }
      } 
    }
  }

  abstract filterValue(quad: any, searchValue: any) : boolean;

  convertSearchValue(value:any){
    return value;
  }

  interrupt(){
    for (let query of this.queryArray){
      query.interrupt();
    }
    this.queryArray = new Array()
  }

  async await_running_queries(){
    await Promise.all(this.queryArray)
  }
}