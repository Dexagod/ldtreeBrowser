import { Query } from './Query';

export class PartialCollectionViewQuery extends Query {  

  //todo:: being able to continue querying on nodes that are stored in the session.

  async followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>> {
    let nextUrl = relationValue
    if (! nextUrl.startsWith("http")){
      if (this.baseURI === null) { throw new Error("Please pass a base-uri to the contructor of the query.")}
      else { nextUrl = this.baseURI + nextUrl }
    }
    return await this.recursiveQueryNode(nextUrl, searchValue, relationValue, level)
  }

  
  async followChildRelations(nodeId : any, nodesMetadata : any, value : any, level : any) : Promise<Array<any>> {
    let runningQueries = []
    if (value === null) { return [] }
    let nodes = new Array()
    for (let node of nodesMetadata){
      if (node.next !== undefined && node.next !== null){
        runningQueries.push(await this.followChildWithValue(null, node.next, value, level))
      }
    }
    await Promise.all(runningQueries);
    let returnlist = new Array();
    for (let list of await runningQueries){
      returnlist = returnlist.concat(await list)
    }
    return returnlist
  }

  async processId(id : any){
    if (this.terminated || this.processedIds.indexOf(id) !== -1) { return null }
    console.log("processing id", id)
    return await this.parser.processHydra(id)
  }

}
