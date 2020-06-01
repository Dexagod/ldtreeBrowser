import { QuadConverter } from '../Clients/Converter/QuadConverer';
const TREEONTOLOGY: string = 'https://w3id.org/tree#';
const HYDRA = "http://www.w3.org/ns/hydra/core#"
const TYPE: string =
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

const RELATIONAL_TYPES: Array<string> = [
  "https://w3id.org/tree#PrefixRelation",
  "https://w3id.org/tree#SubstringRelation",
  "https://w3id.org/tree#GreaterThanRelation",
  "https://w3id.org/tree#GreaterOrEqualThanRelation",
  "https://w3id.org/tree#LesserThanRelation",
  "https://w3id.org/tree#LesserOrEqualThanRelation",
  "https://w3id.org/tree#EqualThanRelation",
  "https://w3id.org/tree#GeospatiallyContainsRelation",
  "https://w3id.org/tree#InBetweenRelation",
];

const DEFAULTTOTALITEMSVALUE : number = Infinity

export class TreeConstructor {

  collections: Set<string> = new Set();
  collectionMembers : Map<string, Array<string>> = new Map();
  collectionViews : Map<string, Array<string>> = new Map();

  nodeIds: Set<string> = new Set();
  nodeRemainingItems: Map<string, number> = new Map();
  nodeRelations: Map<string, Array<string>> = new Map();

  relationIds: Set<string> = new Set();
  relationType: Map<string, string> = new Map();
  relationValue: Map<string, any> = new Map();
  relationNode: Map<string, string> = new Map();
  relationPaths: Map<string, string> = new Map();
  relationRemainingItems: Map<string, number> = new Map();
  
  getProperties(quads : any) : Array<Node>{
    console.time("getting properties")
    for (let quad of quads){
      if (quad.predicate.value === TYPE &&
        quad.object.value === HYDRA + "Collection") {
          this.collections.add(quad.subject.value);

      }  else if (quad.predicate.value === TYPE &&
          quad.object.value === TREEONTOLOGY + "Node") {
        const nodeId = quad.subject.value;
        this.nodeIds.add(nodeId)
      
      } else if (quad.predicate.value === TREEONTOLOGY + "relation") {
        const nodeId = quad.subject.value;
        const relationBlankId = quad.object.value;

        let relations = this.nodeRelations.get(nodeId)
        if (relations !== undefined){
          relations.push(relationBlankId)
          this.nodeRelations.set(nodeId, relations)
        }  else {
          this.nodeRelations.set(nodeId, [relationBlankId])
        }

      } else if (quad.predicate.value === HYDRA + "totalItems") {
        const id = quad.subject.value;
        const remainingItems = parseInt(quad.object.value, 10);
        this.nodeRemainingItems.set(id, remainingItems)
        this.relationRemainingItems.set(id, remainingItems)

      } else if (quad.predicate.value === TREEONTOLOGY + "remainingItems") {
        const id = quad.subject.value;
        const remainingItems = parseInt(quad.object.value, 10);
        this.nodeRemainingItems.set(id, remainingItems)
        this.relationRemainingItems.set(id, remainingItems)

      } else if (quad.predicate.value === TYPE) {
        // Test all relation types
        const relationId = quad.subject.value;
        const relationType = quad.object.value;
        if (RELATIONAL_TYPES.indexOf(relationType) != -1){
          this.relationIds.add(relationId)
          this.relationType.set(relationId, relationType)
        }
      } else if (quad.predicate.value === TREEONTOLOGY + "value") {
        const nodeId = quad.subject.value;
        const relationValue = quad.object.value;
        this.relationValue.set(nodeId, relationValue)

      } else if (quad.predicate.value === TREEONTOLOGY + "node") {
        const nodeId = quad.subject.value;
        const relationNode = quad.object.value;
        this.relationNode.set(nodeId, relationNode)

      } else if (quad.predicate.value === TREEONTOLOGY + "path") {
        const nodeId = quad.subject.value;
        const propvalue = quad.object.value;
        this.relationPaths.set(nodeId, propvalue)
      }

      else if (quad.predicate.value === HYDRA + "view") {
        // TODO:: REMOVE
        const collectionId = quad.subject.value;
        const viewNode = quad.object.value;
        let views = this.collectionViews.get(collectionId)
        if (views !== undefined){
          views.push(viewNode)
          this.collectionViews.set(collectionId, views)
        }  else {
          this.collectionViews.set(collectionId, [viewNode])
        }
      } else if (quad.predicate.value === TREEONTOLOGY + "view") {
        const collectionId = quad.subject.value;
        const viewNode = quad.object.value;
        let views = this.collectionViews.get(collectionId)
        if (views !== undefined){
          views.push(viewNode)
          this.collectionViews.set(collectionId, views)
        }  else {
          this.collectionViews.set(collectionId, [viewNode])
        }
      } else if (quad.predicate.value === HYDRA + "member") {
        const collectionId = quad.subject.value;
        const collectionMemberId = quad.object.value;
        let members = this.collectionMembers.get(collectionId)
        if (members !== undefined){
          members.push(collectionMemberId)
          this.collectionMembers.set(collectionId, members)
        }  else {
          this.collectionMembers.set(collectionId, [collectionMemberId])
        }
      }
    };

    let metadataObject = this.constructTree()
    metadataObject.quads = quads;
    console.timeEnd("getting properties")
    return metadataObject
  };

  private constructRelation(relationBlankId : string) : Relation | null {
    let relationType = this.relationType.get(relationBlankId)
    let relationValue = this.relationValue.get(relationBlankId)
    let relationNode = this.relationNode.get(relationBlankId)
    let relationPath = this.relationPaths.get(relationBlankId)
    let relationRemainingItems = this.relationRemainingItems.get(relationBlankId)
    if (!relationType || !relationValue || !relationNode){
          return null;
        }
    return new Relation(relationType, relationValue, relationNode, relationPath, relationRemainingItems)
  }

  private constructRelationsForNode(nodeId: string) : Array<Relation> {
    let relations = new Array<Relation>();
    let relationBlankIds = this.nodeRelations.get(nodeId)
    if (relationBlankIds === null || relationBlankIds === undefined){ return [] }
    for (let relationBlankId of relationBlankIds){
      let relation = this.constructRelation(relationBlankId)
      if (relation !== undefined && relation !== null){
        relations.push(relation)
      }
    }
    return relations;
  }

  private constructRemainingItemsForNode(nodeId: string) : number {
    let remainingItems = this.nodeRemainingItems.get(nodeId)
    if (remainingItems === null || remainingItems === undefined) { remainingItems = DEFAULTTOTALITEMSVALUE }
    return remainingItems
  }

  private constructCollections() : Array<Collection> {
    let collections = new Array<Collection>();

    for (let key of Array.from(this.collections)){
      let collectionMembers = this.collectionMembers.get(key)
      let collectionViews = this.collectionViews.get(key)
      collectionMembers = collectionMembers === undefined? [] : collectionMembers
      collectionViews = collectionViews === undefined? [] : collectionViews
      collections.push(new Collection(key, collectionMembers, collectionViews))
    }
    return collections;
  }

  private constructNodes() : Array<Node> {
    let nodes: Array<Node> = new Array();
    for (const nodeId of Array.from(this.nodeIds)){
      nodes.push( new Node(nodeId, this.constructRelationsForNode(nodeId), this.constructRemainingItemsForNode(nodeId)) )
    }
    return nodes;
  }


  public constructTree() : any {
    // Put all relations in place

    let metadataObject = {
      nodes : this.constructNodes(),
      collections : this.constructCollections()
    }
    return  metadataObject
  }
}

export class Node {
  id: string;
  relations: Array<Relation> = [];
  remainingItems : number;

  public constructor(id: string, relations : Array<Relation>, remainingItems : number) {
    this.id = id;
    this.relations = relations;
    this.remainingItems = remainingItems;
  }
}

export class Relation {
  type: string;
  value: any;
  node : string;
  path : string | undefined;
  remainingItems: number | undefined;

  constructor (type: string, value: any, node: string, path?: string, remainingItems?: number) {
    this.type = type;
    this.value = value;
    this.node = node;
    this.path = path;
    this.remainingItems = remainingItems;
  }
}

export class Collection {
  id: string;
  members: Array<string>;
  views : Array<string>;

  constructor (id: string, members: Array<string>, views: Array<string>) {
    this.id = id;
    this.members = members;
    this.views = views;
  }
}

