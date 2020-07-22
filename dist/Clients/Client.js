"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Parser_1 = require("../Parser");
const QuadConverer_1 = require("./Converter/QuadConverer");
class Client extends events_1.EventEmitter {
    constructor(emitMembers = true) {
        super();
        this.allItems = new Set();
        this.usedItems = new Set();
        this.emitMembers = emitMembers;
        this.parser = new Parser_1.Parser();
        this.parser.on("client-cache-miss", (obj) => {
            this.emit("client-cache-miss", obj);
        });
        this.parser.on("client-cache-hit", (obj) => {
            this.emit("client-cache-hit", obj);
        });
        this.parser.on("server-cache-miss", (obj) => {
            this.emit("server-cache-miss", obj);
        });
        this.parser.on("server-cache-hit", (obj) => {
            this.emit("server-cache-hit", obj);
        });
        this.parser.on("downloaded", (obj) => {
            this.emit("downloaded", obj);
        });
        this.queryArray = new Array();
    }
    query(searchvalue, queryClass, shaclpath, queryURL, maxamount) {
        return __awaiter(this, void 0, void 0, function* () {
            searchvalue = this.convertSearchValue(searchvalue);
            // let prevqueryprops = await this.previousQueryResponse;
            let parser = this.parser;
            let query = new queryClass(parser, queryURL);
            query.on("data", (data) => {
                this.handleEmitData(query, data, shaclpath, searchvalue, queryURL);
            });
            query.on("followedRelationValue", (value) => {
                this.emit("followedRelationValue", value);
            });
            this.queryArray.push(query);
            var queryTask = null;
            let newQueryResponse = new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    let allItems = new Set();
                    let usedItems = new Set();
                    let currentItems = new Array();
                    let currentSession = null;
                    queryTask = query.query(queryURL, searchvalue, currentSession, maxamount);
                    queryTask.then((resultsession) => {
                        let resultObject = {
                            "session": resultsession,
                            "items": currentItems,
                            "searchvalue": searchvalue,
                            "fulfilled": false,
                            "useditems": usedItems,
                            "allitems": allItems,
                        };
                        resolve(resultObject);
                    }).catch((error) => {
                        console.error(error);
                        let resultObject = {
                            "session": null,
                            "items": currentItems,
                            "searchvalue": searchvalue,
                            "fulfilled": false,
                            "useditems": usedItems,
                            "allitems": allItems,
                        };
                        resolve(resultObject);
                    });
                });
            });
            return [query, queryTask, newQueryResponse];
        });
    }
    handleEmitData(query, data, shaclpath, searchValue, collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            // this.emit('data', data.quads)
            let converter = new QuadConverer_1.QuadConverter();
            yield converter.processQuads(data.quads);
            for (let quad of data.quads) {
                let subject = converter.getIdOrValue(quad.subject);
                this.allItems.add(subject);
                if (converter.getIdOrValue(quad.predicate) === shaclpath[0]) { // TODO => place matching library here
                    if (!(this.usedItems.has(subject)) && this.filterValue(converter.getIdOrValue(quad.object), searchValue)) {
                        this.usedItems.add(subject);
                        this.emit("data", converter.getAllConnectedItemsForId(converter.getIdOrValue(quad.subject)));
                        query.addResult(converter.getIdOrValue(quad.subject));
                    }
                }
            }
        });
    }
    convertSearchValue(value) {
        return value;
    }
    interrupt() {
        for (let query of this.queryArray) {
            query.interrupt();
        }
        this.queryArray = new Array();
        this.reset();
    }
    await_running_queries() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.queryArray);
        });
    }
}
exports.Client = Client;
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
//# sourceMappingURL=Client.js.map