import { Query } from './Query';
import { Normalizer } from './Normalizer';

// const normalizeString = function(e : string) {return e.toLowerCase()}
const normalizeString = function(e : string) { return Normalizer.normalize(e) }


export class PrefixQuery extends Query {  

  //todo:: being able to continue querying on nodes that are stored in the session.

  async followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>> {
    let runningQueries = new Array()
    for (let node of nodesMetadata){
      if (node.id === nodeId){  
        for (let relation of node.relations){
          if (relation.type === "https://w3id.org/tree#PrefixRelation"){
            runningQueries.push( /*await*/ await this.followChildWithValue(relation.node, relation.value, value, level))
          }
        }
      }
    }
    await Promise.all(runningQueries);
    let returnlist = new Array();
    for (let list of await runningQueries){
      returnlist = returnlist.concat(await list)
    }
    return returnlist
  }

  async followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any) : Promise<Array<any>> {
    let normalizedPrefixString = normalizeString(searchValue)
    let normalizedRelationValue = normalizeString(relationValue)
    if ( (normalizedPrefixString.startsWith(normalizedRelationValue) || normalizedRelationValue.startsWith(normalizedPrefixString)) &&  relationValue.length === level){
      return await this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    } else if (searchValue === relationValue){
      return await this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    } else {
      return []
    }
  }

  getInitialSearchValue() : any{
    return "";
  }
}
