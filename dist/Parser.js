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
const TreeConstructor_1 = require("./Helpers/TreeConstructor");
const events_1 = require("events");
const HydraConstructor_1 = require("./Helpers/HydraConstructor");
const Cache = require('node-cache');
const fetcher = require('ldfetch');
class Parser extends events_1.EventEmitter {
    constructor() {
        super();
        this._cache = new Cache({
            stdTTL: 10000,
            checkperiod: 1000 //will delete entries each 1 minute
        });
        this.ldfetch = new fetcher({});
        // this.ldfetch.on("cache-miss", (obj:any) => {
        //   this.emit("client-cache-miss", obj)
        // }) 
        // this.ldfetch.on("cache-hit", (obj:any) => {
        //   this.emit("client-cache-hit", obj)
        // }) 
        this.ldfetch.on("downloaded", (obj) => {
            this.emit("downloaded", obj);
        });
        this.ldfetch.on("serverresponse", (obj) => {
            let serverCacheStatus = null;
            for (let i = 0; i < obj.rawHeaders.length; i++) {
                if (obj.rawHeaders[i] === "X-GG-Cache-Status") {
                    serverCacheStatus = obj.rawHeaders[i + 1];
                    break;
                }
            }
            if (serverCacheStatus === "HIT") {
                this.emit("server-cache-hit", serverCacheStatus);
            }
            else {
                this.emit("server-cache-miss", serverCacheStatus);
            }
        });
    }
    checkCache(url) {
        let cached = this._cache.get(url.replace(/#.*/, ''));
        if (cached !== undefined) {
            this.emit("client-cache-hit", url);
        }
        else {
            this.emit("client-cache-miss", url);
        }
        return cached;
    }
    // private treeConstructor = new TreeConstructor()
    process(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.checkCache(id);
            if (result === undefined) {
                // console.log("requesting id", id)
                //console.time("ldfetch")
                let request = this.ldfetch.get(id);
                result = new Promise(function (resolve) {
                    request.then((requestresult) => {
                        //console.timeEnd("ldfetch")
                        //console.time("processing")
                        resolve(new TreeConstructor_1.TreeConstructor().getProperties(requestresult.triples));
                    });
                });
                this._cache.set(id.replace(/#.*/, ''), result);
            }
            if (result === undefined) {
                throw new Error("ERROR UNDEFINED ");
            }
            let processed = yield result;
            //console.timeEnd("processing")
            return processed;
        });
    }
    processHydra(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield this.checkCache(id);
            if (result === undefined) {
                this.emit("request", id);
                // console.log("requesting id", id)
                let request = this.ldfetch.get(id);
                result = new Promise(function (resolve) {
                    request.then((requestresult) => {
                        resolve(new HydraConstructor_1.HydraConstructor().getProperties(requestresult.triples));
                    });
                });
                this._cache.set(id.replace(/#.*/, ''), result);
            }
            if (result === undefined) {
                throw new Error("ERROR UNDEFINED ");
            }
            return yield result;
        });
    }
}
exports.Parser = Parser;
//# sourceMappingURL=Parser.js.map