import { ReturnWrapper } from './ReturnWrapper';

export class QuadConverter{

  private subjectMap = new Map();

  private graphMap = new Map<any, any>(); // Map<graphId, Set([id1, id2, ...]) with ids of items in the graph
  private objectPerType = new Map<any, any>(); // Map<typeName, Set([id1, id2, ...]) with ids of items with the given type


  public processQuads(quads : Array<any>){
    if (quads === null || quads === undefined || quads.length === undefined || quads.length === 0) {
      return;
    }
    for (let quad of quads){
      if (quad !== undefined && quad !== null){
        // if (! this.checkQuadPresent(quad, this.subjectMap.get(this.getIdOrValue(quad.subject)))){
          this.addToListMap(this.subjectMap, this.getIdOrValue(quad.subject), quad)
          if ( this.getIdOrValue(quad.predicate) === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"){
            this.addToSetMap(this.objectPerType, this.getIdOrValue(quad.object), this.getIdOrValue(quad.subject)) // Map<typename, [id1, id2, ...]>
          }
          if ( quad.graph.termType === "BlankNode" || quad.graph.termType === "NamedNode"){
            this.addToSetMap(this.graphMap, this.getIdOrValue(quad.graph), this.getIdOrValue(quad.subject))
          }
        // }
      }
    }
  }

  private checkQuadPresent(quad : any, quadList : any) : boolean{
    for (let presentQuad of quadList){
      // try{
      //   if (presentQuad.equals(quad)){
      //     return true
      //   }
      // } catch {
        if (
          (this.getIdOrValue(quad.object) === this.getIdOrValue(presentQuad.object)) &&
          (this.getIdOrValue(quad.predicate) === this.getIdOrValue(presentQuad.predicate)) &&
          (this.getIdOrValue(quad.graph) === this.getIdOrValue(presentQuad.graph)) &&
          (this.getIdOrValue(quad.subject) === this.getIdOrValue(presentQuad.subject))
        ){
          return true;
        // }
      }
    } 
    return false;
  }

  getItemForId(id : any, connectOnlyBlankNodes : boolean = true) : ReturnWrapper{
    if (! this.checkIdPresent(id)){
      return {quads:[], jsonld: []};
    }
    return this.getConnectedNodesForNode(id, connectOnlyBlankNodes)
  }

  checkIdPresent(id : any) : boolean {
    return this.subjectMap.get(id) !== undefined;
  }

  checkGraphIdPresent(id : any) : boolean {
    return this.graphMap.get(id) !== undefined;
  }

  getAvailableTypes() : Array<any>{
    return Array.from(this.objectPerType.keys())
  }

  getAvailableIds() : Array<any>{
    return Array.from(this.subjectMap.keys())
  }
  
  getAvailableGraphIds() : Array<any>{
    return Array.from(this.graphMap.keys())
  }

  checkItemContainedByGraph(itemId : any, graphId : any) : boolean{
    return this.graphMap.get(graphId).indexOf(itemId) !== -1
  }


  getIndividualItemsForType(type : any, connectOnlyBlankNodes : boolean = true) : Map<any, ReturnWrapper> | null {
    return this.getIndividualItemsForGraphOrType(this.objectPerType, type, connectOnlyBlankNodes)
  }
  
  getIndividualItemsForGraph(graphId : any, connectOnlyBlankNodes : boolean = true) :  Map<any, ReturnWrapper> | null  {
    return this.getIndividualItemsForGraphOrType(this.graphMap, graphId, connectOnlyBlankNodes)
  }

  getIndividualItemsForGraphOrType(map : Map<any, any>, mapIdentifier : any, connectOnlyBlankNodes : boolean = true) : Map<any, ReturnWrapper> | null {
    let returnMap = new Map();
    if (! map.has(mapIdentifier)) { return null }
    for (let id of map.get(mapIdentifier)){
      returnMap.set(id, this.getItemForId(id, connectOnlyBlankNodes))
    }
    return returnMap
  }

  getItemsForType(type : any, connectOnlyBlankNodes : boolean = true) : ReturnWrapper{
    return this.getAllItemsForGraphOrType(this.objectPerType, type, connectOnlyBlankNodes)
  }
  
  getItemsForGraph(graphId : any, connectOnlyBlankNodes : boolean = true) : ReturnWrapper {
    return this.getAllItemsForGraphOrType(this.graphMap, graphId, connectOnlyBlankNodes)
  }

  getAllItemsForGraphOrType(map : Map<any, any>, mapIdentifier : any, connectOnlyBlankNodes : boolean = true) : ReturnWrapper {
    let objectList = new Array()
    let quadList = new Array()
    for (let id of map.get(mapIdentifier)){   
      let itemReturnWrapper = this.getItemForId(id, connectOnlyBlankNodes)
      objectList = objectList.concat(itemReturnWrapper.jsonld)
      quadList = quadList.concat(itemReturnWrapper.quads)
    }
    let returnWrapper : ReturnWrapper = {
      quads : quadList,
      jsonld : objectList
    }
    return returnWrapper
  }

  getConnectedBlankNodesForId(id : any) : ReturnWrapper{
    return this.getConnectedNodesForNode(id, true)
  }

  private getConnectedNodesForNode(id : any, onlyBlank : boolean, passedIds : Array<any> = new Array()) : ReturnWrapper{
    let node : any = { "id": id }
    let quadsList = Array();

    if (passedIds.indexOf(id) !== -1){
      let returnWrapper : ReturnWrapper = {
        quads : quadsList,
        jsonld : node
      }
      return returnWrapper
    } else {
      passedIds = passedIds.concat(id)
    }

    if (this.graphMap.has(id)){
      let allItemsForGraph = this.getItemsForGraph(id, onlyBlank)
      node["@graph"] = allItemsForGraph.jsonld
      quadsList = quadsList.concat(allItemsForGraph.quads)
    }

    if (this.subjectMap.has(id)){
      for (let quad of this.subjectMap.get(id)){
        if (! this.checkQuadPresent(quad, quadsList)){
          quadsList.push(quad)
          let predicateValue = this.getIdOrValue(quad.predicate)
          if ((onlyBlank === true && quad.object.termType === "BlankNode") || (onlyBlank === false && (quad.object.termType === "NamedNode" || quad.object.termType === "BlankNode"))){
            let nodeReturnWrapper = this.getConnectedNodesForNode(this.getIdOrValue(quad.object), onlyBlank, passedIds)
            quadsList = quadsList.concat(nodeReturnWrapper.quads)
            if (node.hasOwnProperty(predicateValue)){
              node[predicateValue].push(nodeReturnWrapper.jsonld)
            } else {
              node[predicateValue] = [nodeReturnWrapper.jsonld]
            }
          } else {
            if (node.hasOwnProperty(predicateValue)){
              node[predicateValue].push(quad.object)
            } else {
              node[predicateValue] = [quad.object]
            }
          }
        }
      }
    }
 
    let returnWrapper : ReturnWrapper = {
      quads : quadsList,
      jsonld : node
    }
    return returnWrapper
  }

  getAllConnectedItemsForId(id : any) : ReturnWrapper{
    return this.getConnectedNodesForNode(id, false)
  }
 
  public getIdOrValue(object : any){
    if (object.hasOwnProperty("id")){
      return object["id"]
    } else if (object.hasOwnProperty("value")){
      return object["value"]
    } else {
      throw new Error("Triple " + object + " contains no id or value field")
    }
  }

  private addToSetMap(setMap : Map<any, any>, key : any, value : any){
    if (setMap.has(key)){
      setMap.get(key).add(value)
    } else {
      setMap.set(key, new Set([value]))
    }
  }
  private addToListMap(setMap : Map<any, any>, key : any, value : any){
    if (setMap.has(key)){
      setMap.get(key).push(value)
    } else {
      setMap.set(key, new Array(value))
    }
  }
}