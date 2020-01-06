import { Query } from './Query';
const terraformer = require('terraformer')
const terraformerparser = require('terraformer-wkt-parser')
const EventEmitter = require('events');


export class WKTStringQuery extends Query {  

  async followChildRelations(nodeId: string, nodesMetadata: any, value: any, followedValue: any, level: number) : Promise<Array<any>> {
    let runningQueries = []
    for (let node of nodesMetadata){
      if (node.id === nodeId){
        for (let relation of node.relations){
          if (relation.type === "https://w3id.org/tree#GeospatiallyContainsRelation"){
            let childValue = terraformerparser.parse(relation.value);
            if (this.isContained(childValue, value) || this.isOverlapping(childValue, value)) {
              runningQueries.push(await this.followChildWithValue(relation.node, relation.value, value, level))
            }
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
    let childValue = terraformerparser.parse(relationValue);
    if (this.isContained(childValue, searchValue) || this.isOverlapping(childValue, searchValue)) {
      return await this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    } else {
      return []
    }
  }


  isContained(containerObject: any, containedObject: any) {
    try {
      return (new terraformer.Primitive(containerObject).contains(containedObject))
    } catch(err){ return false; }
  }

  isOverlapping(containerObject: any, containedObject: any) {
    try {
      return (new terraformer.Primitive(containerObject).intersects(containedObject))
    } catch(err){ return false; }
  }


}
