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
            runningQueries.push(/*await*/ await this.followChildWithValue(relation.node, relation.value, value, level))
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



  private bboxContainsPoint(bbox: any, pointCoordinates: any){
    if ((bbox[0] <= pointCoordinates[0] && pointCoordinates[0] <= bbox[2]) &&
    (bbox[1] <= pointCoordinates[1] && pointCoordinates[1] <= bbox[3])){
      return true;
    }
    return false;
  }


  private isContained(container: any, contined_object : any) : boolean {
    // if (childGeoObject instanceof terraformer.Point)  { return false } // Point cannot contain other polygon or point
    try {
      if (! container.contains(contined_object)){
        let bbox = container.bbox();
        if (contined_object instanceof terraformer.Point){
          return this.bboxContainsPoint(bbox, contined_object.coordinates)
        } else if (contined_object instanceof terraformer.Polygon){
          for (let coordinate of contined_object.coordinates[0]){
            if (! this.bboxContainsPoint(bbox, coordinate)){
              return false;
            }
          }
          return true
        }
        return false
      } else {
        return true;
      }
    } catch(err){
        return false;
    }
  }

  isOverlapping(containerObject: any, containedObject: any) {
    try {
      return (new terraformer.Primitive(containerObject).intersects(containedObject))
    } catch(err){ return false; }
  }

}
