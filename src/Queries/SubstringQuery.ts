import { Query } from './Query';
import { Normalizer } from './Normalizer';
import TinyQueue from "tinyqueue"
import asyncPool from "tiny-async-pool";
import { rejects } from 'assert';


const DEFAULTCOUNT=100000

const TREE = "https://w3id.org/tree#"
// const normalizeString = function(e : string) {return e.toLowerCase()}
const normalizeString = function(e : string) { return Normalizer.normalize(e) }

const REMAININGITEMSWEIGHT = 0.4;
const MATCHWEIGHT = 1;
const MATCHPERCENTAGEWEIGHT = 10;
const CUTOFFMATCHPERCENTAGE = 0.75;
const PREFIXMULTIPLIERWEIGHT = 3;
const EQUALSPENALTYWEIGHT = 10;

export class SubstringQuery extends Query {  
  relationQueue = new TinyQueue([], function(a:any, b:any) { return b.count - a.count});
  rootNodeItems = null;

  constructor(){
    super();
    this.checkRelationFunction = this.checkRelationFunction.bind(this);
  }

  async query(collectionId : any, value : any, session : any = null, maxamount:number = Infinity) : Promise<any>{
    // let results = await this.processId(collectionId)
    let results = await this.addTask(this.taskqueue, this.processIdTask, collectionId, this);
    if (results !== undefined && results !== null){
      for (let collection of results.collections){
        if (collection.id === collectionId){
          for (let viewRootNodeId of collection.views){
            await this.recursiveQueryNode(viewRootNodeId, value, this.getInitialSearchValue(), 0)
          }
        }
      } 
    }
  }

  // async function main(){
  //   var timings = [500, 800, 200, 400]
  //   const timeout = (i: number) => new Promise(resolve => setTimeout(() => {console.log("done", i); timings.push(3000); resolve(i)}, i));
  //   const results = await asyncPool(2, timings, timeout);
  // }

  checkRelationFunction = async function (ro: RelationObject) { !this.terminated && await this.recursiveQueryNode(ro.relationnode, ro.value, ro.relationvalue, ro.level) }


  async recursiveQueryNode(currentNodeId : any, value : any, followedValue : any, level : any) : Promise<any> {
    if (this.terminated) return;
    let results = await this.addTask(this.taskqueue, this.processIdTask, currentNodeId, this);
    if (this.terminated || results === undefined || results === null) return;

    this.handleEmittingMembers(results, currentNodeId, followedValue, level)
    return await this.followChildRelations(currentNodeId, results.nodes, value, followedValue, level + 1)
  }


  async followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<any> {
    // let runningQueries = new Array()
    for (let node of nodesMetadata){
      if (node.id === nodeId){  
        this.rootNodeItems = this.rootNodeItems || node.remainingItems
        for (let relation of node.relations){
          if (relation.type === TREE+"SubstringRelation" || relation.type === TREE+"EqualThanRelation"){
            let count = this.checkValue(value, relation.value, (relation.remainingItems / (this.rootNodeItems||1)) || 0 , relation.type)
            if(count > 0){
              console.log("pushing", relation.value)
              this.relationQueue.push({count: count, relationnode: relation.node, relationvalue: relation.value, value: value, level: level})
            }
          }
        }
      }
    }
  }

  async followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>> {
    throw new Error("Method not implemented")
  }

  getInitialSearchValue() : any{
    return "";
  }
  

  /**
   * SCORING
   * 
   * percentage match van de relation
   * 
   * 
   * ________________________
   * # remaining items(normalized) compared to length relation
   * 
   * 1. match percentage
   * 2. length of match (this punishes space conversions and such)
   * 3. longest match
   * 4. amount of items (percentage)? / absolute
   * 5.  
   * 
   */

  checkValue(searchValue: string, relationValue: string, remainingItemsPercentage = DEFAULTCOUNT, relationType?: string){
    let ngramsize = 2 // Math.min(searchValue.length, relationValue.length) === 2 ? 2 : 3
    let normalizedSearchValue = normalizeString(searchValue)
    let normalizedRelationValue = normalizeString(relationValue)
    let searchNGrams = this.getNgrams(normalizedSearchValue, ngramsize)
    let relationNGrams = this.getNgrams(normalizedRelationValue, ngramsize)
    let count = 0;
    for (let relationNGram of relationNGrams) {
      if (normalizedSearchValue.includes(relationNGram)){
        count += 1 * MATCHWEIGHT
      }
    }

    // console.log("VALUE", relationValue, count, relationNGrams.length, count/relationNGrams.length)
    if ((count / relationNGrams.length) < CUTOFFMATCHPERCENTAGE) return 0

    let prefixMultiplier = normalizedSearchValue.startsWith(normalizedRelationValue) ? PREFIXMULTIPLIERWEIGHT : 1
    remainingItemsPercentage = ((!remainingItemsPercentage || remainingItemsPercentage === 0 || remainingItemsPercentage < 0 || remainingItemsPercentage > 1) ? 0.5 : remainingItemsPercentage) 

    let matchPercentage = count / relationNGrams.length
    let matchPercentageMultiplier = Math.pow(matchPercentage, 2) * MATCHPERCENTAGEWEIGHT
    let remainingItemsMultiplier = (1 - remainingItemsPercentage) * REMAININGITEMSWEIGHT

    if (relationType && relationType === TREE+"EqualThanRelation"){
      remainingItemsMultiplier *= EQUALSPENALTYWEIGHT
    }
    // TODO -> longest matching substring???
    return count * matchPercentageMultiplier * remainingItemsMultiplier * prefixMultiplier
  }

  getNgrams(value: string, n: number): string[]{
    let results = []
    for (let i = 0; i < value.length - n +1; i++) {results.push(value.substring(i, i+n))}
    return results;
  }

}

interface RelationObject {
  count: number, 
  relationnode: string, 
  relationvalue: any, 
  value: any, 
  level: number
}