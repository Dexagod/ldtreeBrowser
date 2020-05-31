import { Query } from './Query';
export class KNNQuery extends Query{

  foundLocations = [];
  
  followChildRelations(nodeId: any, nodesMetadata: any, value: any, followedValue: any, level: any): Promise<any[]> {
    throw new Error("Method not implemented.");
  }  
  
  followChildWithValue(relationNodeId: any, relationValue: any, searchValue: any, level: any): Promise<any[]> {
    throw new Error("Method not implemented.");
  }


}