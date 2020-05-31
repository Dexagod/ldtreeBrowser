import { Query } from './Query';

export class GetAllQuery extends Query{

    foundLocations = [];
    
    async followChildRelations(nodeId : any, nodesMetadata : any, value : any, followedValue : any, level : any) : Promise<Array<any>> {
        let runningQueries = new Array()
        for (let node of nodesMetadata){
            for (let relation of node.relations){
            runningQueries.push( /*await*/ await this.followChildWithValue(relation.node, relation.value, value, level))
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
        return await this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level)
    }
}