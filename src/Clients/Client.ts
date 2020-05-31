import { EventEmitter } from "events";
import { Parser } from '../Parser';
import { Query } from '../Queries/Query';
import { QuadConverter } from './Converter/QuadConverer';

export abstract class Client extends EventEmitter{
  
  private parser: any;

  protected allItems = new Set();
  protected usedItems = new Set();
  private emitMembers : boolean;

  private queryArray: any;

  constructor(emitMembers = true){
    super();
    this.emitMembers = emitMembers;
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
      let allItems : Set<any> = new Set();
      let usedItems : Set<any> = new Set();

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


    return [query, queryTask, newQueryResponse];
  }


  async handleEmitData(query: Query, data: any, shaclpath: Array<string>, searchValue: any, collectionId: string) {

    // this.emit('data', data.quads)
    let converter = new QuadConverter()
    await converter.processQuads(data.quads)

    for (let quad of data.quads){
      let subject = converter.getIdOrValue(quad.subject)
      this.allItems.add(subject)
      if (converter.getIdOrValue(quad.predicate) === shaclpath[0]) { // TODO => place matching library here
        if(!(this.usedItems.has(subject)) && this.filterValue(converter.getIdOrValue(quad.object), searchValue)){
          this.usedItems.add(subject)
          this.emit("data", converter.getAllConnectedItemsForId(converter.getIdOrValue(quad.subject)))
          query.addResult(converter.getIdOrValue(quad.subject))
        }
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



    // this.emit('data', {data: data.quads, shaclpath: shaclpath, searchValue: searchValue})
    // if(!this.emitMembers) return;
    // let converter = new QuadConverter()
    // converter.processQuads(data.quads)
    // var collection = converter.getItemForId(collectionId).jsonld;
    // // let nodes = converter.getItemsForType("https://w3id.org/tree#Node").jsonld
    // // for (let node of nodes){
    // //   this.emit("node", node)
    // // }

    // console.log("collection", collection)
    // if (collection === undefined || collection === undefined){ return; }
    // let members = collection['http://www.w3.org/ns/hydra/core#member']
    // if (members === undefined || members === undefined){ return; }
    // console.log(converter.subjectMap.keys())
    // console.log(converter.graphMap)
    // for (let member of members){
    //   console.log("member", member, converter.getIdOrValue(member), converter.getConnectedBlankNodesForId(converter.getIdOrValue(member)))
    //   let memberresult = converter.getConnectedBlankNodesForId(converter.getIdOrValue(member))
    //   member = memberresult.jsonld
    //   let item = member;
    //   for (let property of shaclpath){
    //     if (item[property] === null || item[property] === undefined){
    //       break
    //     } else {
    //       item = item[property]
    //       if (Array.isArray(item))
    //       item = item[0]
    //     }
    //   }
    //   this.allItems.add(member["id"])
    //   item = converter.getIdOrValue(item)
    //   if (item !== null &&  item !== undefined && this.filterValue(item, searchValue)){
    //     this.usedItems.add(member["@id"])
    //     query.results += 1;
    //     this.emit("member", memberresult.jsonld)
    //   } 
    // }