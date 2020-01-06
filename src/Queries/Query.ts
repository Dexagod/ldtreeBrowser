
import { EventEmitter } from "events";
import { Parser } from '../Parser';

export abstract class Query extends EventEmitter{

  parser : any;
  terminated : boolean;
  processedIds : Array<string> = []

  baseURI: string | null;
  
  constructor(parser : any, baseURI : string | null){
    super();
    this.terminated = false
    if (parser === null || parser === undefined){
      this.parser = new Parser();
    } else {
      this.parser = parser;
    }
    this.baseURI = baseURI
  }

  async query(collectionId : any, value : any, session : any = null) : Promise<Array<any> | null>{
    let runningQueries = []
    
    if (session !== null){
      // console.log("FOLLOWING SESSION", session)
      let nodes = session.nodes;
      for (let node of nodes){
        if (this.terminated){
          runningQueries.push([node])
        } else {
          runningQueries.push(await this.followChildWithValue(node.currentNodeId, node.relationValue, value, node.level))
        }
      }
    } else {
      let results = await this.processId(collectionId)
      session = {}
      session.nodes = new Array();
      for (let collection of results.collections){
        if (collection.id === collectionId){
          for (let viewRootNodeId of collection.views){
            runningQueries.push(await this.recursiveQueryNodeInitial(viewRootNodeId, value, this.getInitialSearchValue(), 0, results))
          }
        }
      } 
    }
    
    await Promise.all(runningQueries)
    let nodeList = []
    for (let nodes of await(runningQueries)){
      for (let node of await(nodes)){
        nodeList.push(await(node))
      }
    }   
    session.nodes = nodeList
    return session;
  }

  async recursiveQueryNodeInitial(currentNodeId : any, value : any, followedValue : any, level : any, results: any) : Promise<Array<any>> {
    await this.handleEmittingMembers(results, currentNodeId, followedValue, level)
    return await this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1)
  }

  async recursiveQueryNode(currentNodeId : any, value : any, followedValue : any, level : any) : Promise<Array<any>> {
    let results = await this.processId(currentNodeId)
    if (results === null) { 
      return [{currentNodeId : currentNodeId, value: value, relationValue: followedValue, level: level}] 
    }
    await this.handleEmittingMembers(results, currentNodeId, followedValue, level)
    return await this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1)
  }

  abstract followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>>;

  abstract followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>>;

  async processId(id : any){
    if (this.terminated || this.processedIds.indexOf(id) !== -1) { return null }
    console.log("processing id", id)
    return await this.parser.process(id)
  }

  async handleEmittingMembers(results : any, searchedNodeId : any, nodeValue: any, level : any){
    for (let node of results.nodes){
      if (node.id === searchedNodeId){
        node.level = level
        node.value = nodeValue
        this.emit("node", node)
      }
    }
    this.emit("data", results)
  }

  getInitialSearchValue() : any{
    return null;
  }

  interrupt(){
    this.terminated = true;
  }
}