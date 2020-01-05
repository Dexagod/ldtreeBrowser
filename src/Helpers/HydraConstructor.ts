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

export class HydraConstructor {

  collections: Set<string> = new Set();
  collectionMembers : Map<string, Array<string>> = new Map();
  collectionViews : Map<string, Array<string>> = new Map();

  partialCollectionViewIds: Set<string> = new Set();
  nodeRemainingItems: Map<string, number> = new Map();

  first: Map<string,any> = new Map();
  previous: Map<string,any> = new Map();
  next: Map<string,any> = new Map();
  last: Map<string,any> = new Map();
  
  getProperties(quads : any) : Array<Node>{
    for (let quad of quads){
      if (quad.predicate.value === TYPE &&
        quad.object.value === HYDRA + "Collection") {
          this.collections.add(quad.subject.value);

      }  else if (quad.predicate.value === TYPE &&
          quad.object.value === HYDRA + "PartialCollectionView") {
        const pcvId = quad.subject.value;
        this.partialCollectionViewIds.add(pcvId)
      
      } else if (quad.predicate.value === HYDRA + "totalItems") {
        const nodeId = quad.subject.value;
        const remainingItems = quad.object.value;
        this.nodeRemainingItems.set(nodeId, remainingItems)

      } else if (quad.predicate.value === TREEONTOLOGY + "remainingItems") {
        const nodeId = quad.subject.value;
        const remainingItems = quad.object.value;
        this.nodeRemainingItems.set(nodeId, remainingItems)

      } else if (quad.predicate.value === HYDRA + "view") {
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
      } else if (quad.predicate.value === HYDRA + "first") {
        const pcvId = quad.subject.value;
        let identifier = quad.object.value;
        this.first.set(pcvId, identifier)
      } else if (quad.predicate.value === HYDRA + "previous") {
        const pcvId = quad.subject.value;
        let identifier = quad.object.value;
        this.previous.set(pcvId, identifier)
      } else if (quad.predicate.value === HYDRA + "next") {
        const pcvId = quad.subject.value;
        let identifier = quad.object.value;
        this.next.set(pcvId, identifier)
      } else if (quad.predicate.value === HYDRA + "last") {
        const pcvId = quad.subject.value;
        let identifier = quad.object.value;
        this.last.set(pcvId, identifier)
      }
    };

    let metadataObject = this.constructTree()
    metadataObject.quads = quads;
    return metadataObject
  };

  private constructRemainingItemsForNode(nodeId: string) : number {
    let remainingItems = this.nodeRemainingItems.get(nodeId)
    if (remainingItems === null || remainingItems === undefined) { remainingItems = DEFAULTTOTALITEMSVALUE }
    return remainingItems
  }

  private constructCollections() : Array<Collection> {
    let collections = new Array<Collection>();

    for (let key of this.collections){
      let collectionMembers = this.collectionMembers.get(key)
      let collectionViews = this.collectionViews.get(key)
      collectionMembers = collectionMembers === undefined? [] : collectionMembers
      collectionViews = collectionViews === undefined? [] : collectionViews
      collections.push(new Collection(key, collectionMembers, collectionViews))
    }
    return collections;
  }

  private constructNodes() : Array<PCV> {
    let pcvIds: Array<PCV> = new Array();
    for (const pcvId of Array.from(this.partialCollectionViewIds)){
      let first = this.first.get(pcvId) ? this.first.get(pcvId) : null
      let previous = this.previous.get(pcvId) ? this.previous.get(pcvId) : null
      let next = this.next.get(pcvId) ? this.next.get(pcvId) : null
      let last = this.last.get(pcvId) ? this.last.get(pcvId) : null
      pcvIds.push( new PCV(pcvId, first, previous, next, last, this.constructRemainingItemsForNode(pcvId)) )
    }
    return pcvIds;
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

export class PCV {
  id: string;
  first: any;
  previous: any;
  next: any;
  last: any;
  remainingItems : number;

  public constructor(id: string, first: any, previous: any, next: any, last: any, remainingItems : number) {
    this.id = id;
    this.first = first;
    this.previous = previous;
    this.next = next;
    this.last = last;
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

