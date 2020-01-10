import { Query } from './Query_single';

export class BTreeQuery extends Query { 
  async followChildRelations(nodeId : any, nodesMetadata : any, value : any, level : any) : Promise<Array<any>> {
    if (value === null) { return [] }
    let runningQueries = []
    for (let node of nodesMetadata){
      if (node.id === nodeId){  
        let relations = node.relations
        let intervalMap = this.extractRelationIntervals(relations)
        for (let intervalEntry of Array.from(intervalMap.entries())){
          runningQueries.push(await this.followChildWithValue(intervalEntry[0], intervalEntry[1], value, level))
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
    if (this.checkFollowInterval(relationValue, searchValue))
    {
      return await this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    } else {
      return []
    }
  }

  extractRelationIntervals(relations : Array<any>){
    let intervals = new Map();
    for (let relation of relations){
      if (relation.type === "https://w3id.org/tree#LesserThanRelation"){
        this.addInterval(intervals, relation.node, "lt", relation.value)
      } else if (relation.type === "https://w3id.org/tree#LesserOrEqualThanRelation"){
        this.addInterval(intervals, relation.node, "lte", relation.value)
      } else if (relation.type === "https://w3id.org/tree#GreaterOrEqualThanRelation"){
        this.addInterval(intervals, relation.node, "gte", relation.value)
      } else if (relation.type === "https://w3id.org/tree#GreaterThanRelation"){
        this.addInterval(intervals, relation.node, "gt", relation.value)
      } 
    }
    return intervals;
  }

  addInterval(intervalMap : Map<any, any>, node : any, predicate : string, value : any){
    let interval = intervalMap.get(node)
    if (interval === undefined){
      intervalMap.set(node, { [predicate] : value})
    } else {
      intervalMap.get(node)[predicate] = value
    }
  }

  checkFollowInterval(interval : any, value: any){
    if ((interval['lt'] === undefined || value.localeCompare(interval['lt']) < 0) &&
      (interval['lte'] === undefined || value.localeCompare(interval['lte']) <= 0) &&
      (interval['gte'] === undefined || value.localeCompare(interval['gte']) >= 0) &&
      (interval['gt'] === undefined || value.localeCompare(interval['gt']) > 0))
    { return true; }
    return false;
  }
}
