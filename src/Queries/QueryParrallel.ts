
import { EventEmitter } from "events";
import { Parser } from '../Parser';
const PromiseQueue = require("easy-promise-queue").default;

export abstract class QueryParrallel extends EventEmitter{

  protected parser : any;
  terminated : boolean;
  protected processedIds : Array<string> = []

  protected baseURI: string | null;
  
  protected taskqueue: any;

  constructor(parser : any, baseURI : string | null, tasks: number = 1){
    super();
    this.terminated = false
    if (parser === null || parser === undefined){
      this.parser = new Parser();
    } else {
      this.parser = parser;
    }
    this.baseURI = baseURI

    this.taskqueue = new PromiseQueue({concurrency: 1});
    
  }

  async query(collectionId : any, value : any, session : any = null) : Promise<Array<any> | null>{
    let runningQueries = []
    
    if (session !== null){
      let nodes = session.nodes;
      for (let node of nodes){
        if (this.terminated){
          runningQueries.push([node])
        } else {
          runningQueries.push(await this.followChildWithValue(node.currentNodeId, node.relationValue, value, node.level))
        }
      }
    } else {
      // let results = await this.processId(collectionId)
      let results = await this.addTask(this.taskqueue, this.processIdTask, collectionId, this);

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
    // let results = await this.processId(currentNodeId)
    let results = await this.addTask(this.taskqueue, this.processIdTask, currentNodeId, this);
    if (results === null) { 
      return [{currentNodeId : currentNodeId, value: value, relationValue: followedValue, level: level}] 
    }
    await this.handleEmittingMembers(results, currentNodeId, followedValue, level)
    return await this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1)
  }

  abstract followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>>;

  abstract followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>>;

  // async processId(id : any){
  //   if (this.terminated || this.processedIds.indexOf(id) !== -1) { return null }
  //   return await this.parser.process(id)
  // }

  async processIdTask(id : any, query: any){
    if (query.terminated || query.processedIds.indexOf(id) !== -1) { return null }
    let processed =  await query.parser.process(id)
    query.processedIds.push(id)
    return processed
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

  addTask(taskqueue : any, fct : Function, ...args : any[]) : Promise<any> | null {
    return new Promise(function (resolve, reject) {
      taskqueue.add(() => {
        return new Promise(function (resolve, reject) {
          fct(...args).then( (e:any) => resolve(e))
        }).then( (e:any) => {resolve(e)});
      });
    })
   
  }

  getInitialSearchValue() : any{
    return null;
  }

  interrupt(){
    this.terminated = true;
  }
}