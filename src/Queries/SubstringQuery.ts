import { Query } from './Query';
import { Normalizer } from './Normalizer';
import TinyQueue from "tinyqueue"

const stringSimilarity = require('string-similarity');

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

const SIMILARITYTHRESHOLD = 0.5;

export class SubstringQuery extends Query {  
  relationQueue = new TinyQueue([], function(a:any, b:any) { return b.count - a.count});
  rootNodeItems = null;

  async followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>> {
    // let runningQueries = new Array()
    for (let node of nodesMetadata){
      if (node.id === nodeId){  
        this.rootNodeItems = this.rootNodeItems || node.remainingItems
        for (let relation of node.relations){
          if (relation.type === TREE+"SubstringRelation" || relation.type === TREE+"EqualThanRelation"){
            //let count = this.checkValue(value, relation.value, (relation.remainingItems / (this.rootNodeItems||1)) || 0 , relation.type)
            const count = this.checkValue2(value, relation.value, node.relations.length, followedValue);
            if(count > 0){
              // runningQueries.push({count: count, relation: await this.followChildWithValue(relation.node, relation.value, value, level)})
              // console.log("pushing", "followed", followedValue, "relation", "'" + relation.value + "'", count)
              // console.log("pushing", relation.value)
              this.relationQueue.push({count: count, relationnode: relation.node, relationvalue: relation.value, value: value, level: level})
            }
          }
        }
      }
    }

    let returnlist = new Array();
    let runningQueries = [];
    while (this.relationQueue.length){
      let relationData = this.relationQueue.pop();
      //let queryExecution = await this.followChildWithValue(relationData.relationnode, relationData.relationvalue, relationData.value, relationData.level)
      let queryExecution = this.followChildWithValue(relationData.relationnode, relationData.relationvalue, relationData.value, relationData.level)
      runningQueries.push(queryExecution);
    }
    await Promise.all(runningQueries);
    for (let list of await runningQueries){
      returnlist = returnlist.concat(await list)
    }
    return returnlist
  }

  async followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>> {
    let count = this.checkValue2(searchValue, relationValue, null, null);
    if(count > 0 && !this.terminated){
      console.log("FOLLOWING", "'" +relationValue+"'", count);
      return this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    }
    return [];
  }

  getInitialSearchValue() : any{
    return "";
  }

  checkValue2(searchValue: string, relationValue: string, relations: any, followedValue: any) {
    let normalizedSearchValue = normalizeString(searchValue);
    let normalizedRelationValue = normalizeString(relationValue);

    const similarity = stringSimilarity.compareTwoStrings(normalizedSearchValue, normalizedRelationValue);

    if(similarity > SIMILARITYTHRESHOLD) {
      // Prioritize highly similar branches
      return similarity * 10;
    } else if(relations && relations < 2 && followedValue === normalizedRelationValue) {
      // Skip too deep and monotonous tree branches
      return 0;
    } else if(normalizedSearchValue.includes(normalizedRelationValue) && normalizedRelationValue.length > 1) {
      // Still keep not so similar ones but that are suffixes of the query value
      return 1 + similarity;
    } else {
      return 0;
    }
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
    // let searchNGrams = this.getNgrams(normalizedSearchValue, ngramsize)
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

    let matchPercentage = (count / relationNGrams.length) || 0.5
    let matchPercentageMultiplier = (Math.pow(matchPercentage, 2) * MATCHPERCENTAGEWEIGHT) || 0.5
    let remainingItemsMultiplier = ((1 - remainingItemsPercentage) * REMAININGITEMSWEIGHT) || 0.5

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
