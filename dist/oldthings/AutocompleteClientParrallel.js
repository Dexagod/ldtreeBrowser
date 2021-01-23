"use strict";
// import { Parser } from '../Parser';
// import { Client } from '../Clients/Client';
// import { Query } from '../Queries/Query';
// // const PromiseQueue = require("easy-promise-queue").default;
// const normalizeString = function(e:string) {return e.toLowerCase()}
// export class AutocompleteClientParrallel extends Client{
//   handleEmitData(query: Query, data: any, shaclpath: string, searchvalue: any): void {
//     throw new Error("Method not implemented.");
//   }  
//   filterQuad(quad: any, shaclpath: string, searchValue: any): boolean {
//     throw new Error("Method not implemented.");
//   }
//   // private parser: any;
//   // private allQueries = new Array();
//   // private querySeriesIdsRequested = new Set();
//   // private allItemsIds = new Set()
//   // private usedItemsIds = new Set()
//   // constructor(){
//   //   super();
//   //   this.parser = new Parser();
//   //   this.parser.on("client-cache-miss", (obj:any) => {
//   //     if (! this.querySeriesIdsRequested.has(obj)){
//   //       this.emit("client-cache-miss", obj)
//   //       this.querySeriesIdsRequested.add(obj)
//   //     }
//   //   }) 
//   //   this.parser.on("client-cache-hit", (obj:any) => {
//   //     if (! this.querySeriesIdsRequested.has(obj)){
//   //       this.emit("client-cache-hit", obj)
//   //       this.querySeriesIdsRequested.add(obj)
//   //     }
//   //   }) 
//   //   this.parser.on("server-cache-miss", (obj:any) => {
//   //     this.emit("server-cache-miss", obj)
//   //   }) 
//   //   this.parser.on("server-cache-hit", (obj:any) => {
//   //     this.emit("server-cache-hit", obj)
//   //   }) 
//   //   this.parser.on("downloaded", (obj:any) => {
//   //     this.emit("downloaded", obj)
//   //   }) 
//   // }
//   // query(searchvalue: string, queryClass : any, shaclpath: string, queryURL: any, maxamount: number){
//   //   let parser = this.parser;
//   //   let query = new queryClass(parser, queryURL);
//   //   let usedItems = 0;
//   //   query.on("data", (data: any) => {
//   //     for(let quad of data.quads){
//   //       if (quad.predicate.value === shaclpath && normalizeString(quad.object.value).startsWith(normalizeString(searchvalue))){
//   //         usedItems += 1
//   //         this.usedItemsIds.add(quad.subject.value);
//   //         this.allItemsIds.add(quad.subject.value);
//   //         if (! query.isTerminated()){
//   //           this.emit("data", quad)
//   //           if (usedItems >= maxamount){
//   //             query.interrupt();
//   //           }
//   //         }
//   //       } else if (quad.predicate.value === shaclpath){
//   //         this.allItemsIds.add(quad.subject.value);
//   //       }
//   //     }
//   //     this.emit("efficiency", {all: this.allItemsIds.size, used: this.usedItemsIds.size})
//   //   })
//   //   let queryTask = query.query(queryURL, searchvalue, null)
//   //   this.allQueries.push(queryTask)
//   //   return [query, queryTask];
//   // }
//   // async await_running_queries(){
//   //   if ( this.allQueries !== undefined && this.allQueries !== null && this.allQueries.length !== 0){
//   //     try{
//   //       await Promise.all(this.allQueries)
//   //     } catch (e) {
//   //       console.log("ERROR", e)
//   //     }
//   //   }
//   //   this.allQueries = new Array();
//   //   this.querySeriesIdsRequested = new Set()
//   //   this.allItemsIds = new Set()
//   //   this.usedItemsIds = new Set()
//   // }
// }z
//# sourceMappingURL=AutocompleteClientParrallel.js.map