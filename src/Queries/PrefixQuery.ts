import { Query } from './Query_single';

const normalizeString = function(e : string) {return e.toLowerCase()}


export class PrefixQuery extends Query {  

  //todo:: being able to continue querying on nodes that are stored in the session.

  async followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>> {
    let runningQueries = new Array()
    for (let node of nodesMetadata){
      if (node.id === nodeId){  
        for (let relation of node.relations){
          if (relation.type === "https://w3id.org/tree#PrefixRelation"){
            runningQueries.push(await this.followChildWithValue(relation.node, relation.value, value, level))
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
    if (normalizedPrefixString.startsWith(normalizedRelationValue) || normalizedRelationValue.startsWith(normalizedPrefixString) ){
      return await this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    } else {
      return []
    }
  }

  getInitialSearchValue() : any{
    return "";
  }
}
