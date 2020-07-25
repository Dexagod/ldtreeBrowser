
import { EventEmitter } from "events";
import { Parser } from '../Parser';
const PromiseQueue = require("easy-promise-queue").default;

export abstract class Query extends EventEmitter{

  protected parser : any;
  protected terminated : boolean;
  protected processedIds : Array<string> = []

  protected baseURI: string | null;
  
  protected taskqueue: any;
  private resultIds = new Set();

  public maxamount: number;

  public results = 0;

  constructor(parser : any, baseURI : string | null){
    super();
    this.terminated = false
    if (parser === null || parser === undefined){
      this.parser = new Parser();
    } else {
      this.parser = parser;
    }
    this.baseURI = baseURI

    this.taskqueue = new PromiseQueue({concurrency: 4});

    this.maxamount = Infinity;
    
  }

  addResult(id: string){
    this.resultIds.add(id)
    if(this.resultIds.size > this.maxamount){
      this.interrupt();
    }

  }

  async query(collectionId : any, value : any, session : any = null, maxamount:number = Infinity) : Promise<Array<any> | null>{
    this.maxamount = maxamount;
    let runningQueries = []
    
    if (session !== null){
      let nodes = session.nodes;
      for (let node of nodes){
        if (this.terminated){
          runningQueries.push([node])
        } else {
          runningQueries.push(this.followChildWithValue(node.currentNodeId, node.relationValue, value, node.level))
        }
      }
    } else {
      // let results = await this.processId(collectionId)
      let results = await this.addTask(this.taskqueue, this.processIdTask, collectionId, this);
      session = {}
      session.nodes = new Array();
      if (results !== undefined && results !== null){
        for (let collection of results.collections){
          if (collection.id === collectionId){
            for (let viewRootNodeId of collection.views){
              runningQueries.push(this.recursiveQueryNodeInitial(viewRootNodeId, value, this.getInitialSearchValue(), 0, results))
            }
          }
        } 
      }
    }
    
    await Promise.all(runningQueries)
    if (session === null || session === undefined){
      session = {}
      session.nodes = [];
    }
    if (session.nodes === null) {
      session.nodes = [];
    }
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
    this.handleEmittingMembers(results, currentNodeId, followedValue, level)
    return await this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1)
  }
  
  async recursiveQueryNode(currentNodeId : any, value : any, followedValue : any, level : any) : Promise<Array<any>> {
    // let results = await this.processId(currentNodeId)
    if (this.terminated) {
      return [{currentNodeId : currentNodeId, value: value, relationValue: followedValue, level: level}] 
    } 
    let results = await this.addTask(this.taskqueue, this.processIdTask, currentNodeId, this);
    
    if (this.terminated || results === undefined || results === null) { 
      return [{currentNodeId : currentNodeId, value: value, relationValue: followedValue, level: level}] 
    }
    this.handleEmittingMembers(results, currentNodeId, followedValue, level)
    return await this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1)
  }

  abstract followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>>;

  abstract followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>>;

  // async processId(id : any){
  //   if (this.terminated || this.processedIds.indexOf(id) !== -1) { return null }
  //   return await this.parser.process(id)
  // }

  async processIdTask(id : any, query: any){
    // if (query.terminated || query.processedIds.indexOf(id) !== -1) { return null }
    let processed = await query.parser.process(id)
    if (processed === undefined || processed === null){
      processed = null;
    } else {
      query.processedIds.push(id)
    }
    return processed
  }

  handleEmittingMembers(results : any, searchedNodeId : any, nodeValue: any, level : any){
    for (let node of results.nodes){
      if (node.id === searchedNodeId){
        node.level = level
        node.value = nodeValue
        this.emit("node", node)
      }
    }
    this.emit("data", results)
    if (nodeValue !== null && nodeValue !== undefined){
      this.emit("followedRelationValue", nodeValue)
    }
  }

  addTask(taskqueue : any, fct : Function, ...args : any[]) : Promise<any> | null {
    return new Promise(function (outerresolve, outerreject) {
      taskqueue.add(() => {
        return new Promise(function (resolve, reject) {
          fct(...args).then( (e:any) => resolve(e)).catch( (e:any) => reject(e))
        }).then( (e:any) => {outerresolve(e)}).catch( (e:any) => {outerreject(e)});
      });
    })
  }

  getInitialSearchValue() : any{
    return null;
  }

  interrupt(){
    this.terminated = true;
  }

  isTerminated(){
    return this.terminated
  }

}