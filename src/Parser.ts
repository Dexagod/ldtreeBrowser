import { TreeConstructor } from './Helpers/TreeConstructor';
import { EventEmitter } from 'events';
import { HydraConstructor } from './Helpers/HydraConstructor';
let fetcher = require('ldfetch')

export class Parser extends EventEmitter{
  private ldfetch : any;
  constructor(){
    super()
    this.ldfetch = new fetcher({})
    this.ldfetch.on("cache-miss", (obj:any) => {
      this.emit("client-cache-miss", obj)
    }) 
    this.ldfetch.on("cache-hit", (obj:any) => {
      this.emit("client-cache-hit", obj)
    }) 
    this.ldfetch.on("serverresponse", (obj:any) => {
      let serverCacheStatus = null
      for (let i = 0; i < obj.rawHeaders.length; i++){
        if (obj.rawHeaders[i] === "X-GG-Cache-Status"){
          serverCacheStatus = obj.rawHeaders[i+1]
          break
        }
      }
      let totalBytesRead = obj.socket.bytesRead
      let url = obj.responseUrl
      this.emit("server-cache-status", serverCacheStatus)
      this.emit("bandwith", totalBytesRead)
    })
  }
  // private treeConstructor = new TreeConstructor()
  async process(id : string){
    let triples = (await this.ldfetch.get(id)).triples
    return new TreeConstructor().getProperties(triples)
  }

  async processHydra(id : string){
    let triples = (await this.ldfetch.get(id)).triples
    return new HydraConstructor().getProperties(triples)
  }

  
}