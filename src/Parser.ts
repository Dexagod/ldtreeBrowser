import { TreeConstructor } from './Helpers/TreeConstructor';
import { EventEmitter } from 'events';
import { HydraConstructor } from './Helpers/HydraConstructor'
import Cache = require('node-cache');
let fetcher = require('ldfetch')

export class Parser extends EventEmitter{
  private ldfetch : any;
  _cache = new Cache({
    stdTTL: 10000, //standard time to live is 60 seconds
    checkperiod: 1000 //will delete entries each 1 minute
  });

  constructor(){
    super()
    this.ldfetch = new fetcher({})
    this.ldfetch.on("cache-miss", (obj:any) => {
      this.emit("client-cache-miss", obj)
    }) 
    this.ldfetch.on("cache-hit", (obj:any) => {
      this.emit("client-cache-hit", obj)
    }) 
    this.ldfetch.on("downloaded", (obj:any) => {
      this.emit("downloaded", obj)
    })
    this.ldfetch.on("serverresponse", (obj:any) => {
      let serverCacheStatus = null
      for (let i = 0; i < obj.rawHeaders.length; i++){
        if (obj.rawHeaders[i] === "X-GG-Cache-Status"){
          serverCacheStatus = obj.rawHeaders[i+1]
          break
        }
      }
      if (serverCacheStatus === "HIT"){
        this.emit("server-cache-hit", serverCacheStatus)
      } else {
        this.emit("server-cache-miss", serverCacheStatus)
      }
    })
  }

  checkCache(url : string){
    let cached = this._cache.get(url.replace(/#.*/, ''));
    if (cached !== undefined){
      this.emit("client-cache-hit");
    }
    return cached;
  }
  // private treeConstructor = new TreeConstructor()
  async process(id : string){
    let result = this.checkCache(id)
    if (result === undefined){
      this.emit("request", id)
      let triples = (await this.ldfetch.get(id)).triples
      result = new TreeConstructor().getProperties(triples)
    }
    return result;
  }

  async processHydra(id : string){
    let result = this.checkCache(id)
    if (result === undefined){
      this.emit("request", id)
      let triples = (await this.ldfetch.get(id)).triples
      result = new HydraConstructor().getProperties(triples)
    }
    return result
  }

  
}