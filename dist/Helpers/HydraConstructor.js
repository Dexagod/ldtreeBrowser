"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TREEONTOLOGY = 'https://w3id.org/tree#';
const HYDRA = "http://www.w3.org/ns/hydra/core#";
const TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RELATIONAL_TYPES = [
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
const DEFAULTTOTALITEMSVALUE = Infinity;
class HydraConstructor {
    constructor() {
        this.collections = new Set();
        this.collectionMembers = new Map();
        this.collectionViews = new Map();
        this.partialCollectionViewIds = new Set();
        this.nodeRemainingItems = new Map();
        this.first = new Map();
        this.previous = new Map();
        this.next = new Map();
        this.last = new Map();
    }
    getProperties(quads) {
        for (let quad of quads) {
            if (quad.predicate.value === TYPE &&
                quad.object.value === HYDRA + "Collection") {
                this.collections.add(quad.subject.value);
            }
            else if (quad.predicate.value === TYPE &&
                quad.object.value === HYDRA + "PartialCollectionView") {
                const pcvId = quad.subject.value;
                this.partialCollectionViewIds.add(pcvId);
            }
            else if (quad.predicate.value === HYDRA + "totalItems") {
                const nodeId = quad.subject.value;
                const remainingItems = quad.object.value;
                this.nodeRemainingItems.set(nodeId, remainingItems);
            }
            else if (quad.predicate.value === TREEONTOLOGY + "remainingItems") {
                const nodeId = quad.subject.value;
                const remainingItems = quad.object.value;
                this.nodeRemainingItems.set(nodeId, remainingItems);
            }
            else if (quad.predicate.value === HYDRA + "view") {
                // TODO:: REMOVE
                const collectionId = quad.subject.value;
                const viewNode = quad.object.value;
                let views = this.collectionViews.get(collectionId);
                if (views !== undefined) {
                    views.push(viewNode);
                    this.collectionViews.set(collectionId, views);
                }
                else {
                    this.collectionViews.set(collectionId, [viewNode]);
                }
            }
            else if (quad.predicate.value === HYDRA + "member") {
                const collectionId = quad.subject.value;
                const collectionMemberId = quad.object.value;
                let members = this.collectionMembers.get(collectionId);
                if (members !== undefined) {
                    members.push(collectionMemberId);
                    this.collectionMembers.set(collectionId, members);
                }
                else {
                    this.collectionMembers.set(collectionId, [collectionMemberId]);
                }
            }
            else if (quad.predicate.value === HYDRA + "first") {
                const pcvId = quad.subject.value;
                let identifier = quad.object.value;
                this.first.set(pcvId, identifier);
            }
            else if (quad.predicate.value === HYDRA + "previous") {
                const pcvId = quad.subject.value;
                let identifier = quad.object.value;
                this.previous.set(pcvId, identifier);
            }
            else if (quad.predicate.value === HYDRA + "next") {
                const pcvId = quad.subject.value;
                let identifier = quad.object.value;
                this.next.set(pcvId, identifier);
            }
            else if (quad.predicate.value === HYDRA + "last") {
                const pcvId = quad.subject.value;
                let identifier = quad.object.value;
                this.last.set(pcvId, identifier);
            }
        }
        ;
        let metadataObject = this.constructTree();
        metadataObject.quads = quads;
        return metadataObject;
    }
    ;
    constructRemainingItemsForNode(nodeId) {
        let remainingItems = this.nodeRemainingItems.get(nodeId);
        if (remainingItems === null || remainingItems === undefined) {
            remainingItems = DEFAULTTOTALITEMSVALUE;
        }
        return remainingItems;
    }
    constructCollections() {
        let collections = new Array();
        for (let key of Array.from(this.collections)) {
            let collectionMembers = this.collectionMembers.get(key);
            let collectionViews = this.collectionViews.get(key);
            collectionMembers = collectionMembers === undefined ? [] : collectionMembers;
            collectionViews = collectionViews === undefined ? [] : collectionViews;
            collections.push(new Collection(key, collectionMembers, collectionViews));
        }
        return collections;
    }
    constructNodes() {
        let pcvIds = new Array();
        for (const pcvId of Array.from(this.partialCollectionViewIds)) {
            let first = this.first.get(pcvId) ? this.first.get(pcvId) : null;
            let previous = this.previous.get(pcvId) ? this.previous.get(pcvId) : null;
            let next = this.next.get(pcvId) ? this.next.get(pcvId) : null;
            let last = this.last.get(pcvId) ? this.last.get(pcvId) : null;
            pcvIds.push(new PCV(pcvId, first, previous, next, last, this.constructRemainingItemsForNode(pcvId)));
        }
        return pcvIds;
    }
    constructTree() {
        // Put all relations in place
        let metadataObject = {
            nodes: this.constructNodes(),
            collections: this.constructCollections()
        };
        return metadataObject;
    }
}
exports.HydraConstructor = HydraConstructor;
class PCV {
    constructor(id, first, previous, next, last, remainingItems) {
        this.id = id;
        this.first = first;
        this.previous = previous;
        this.next = next;
        this.last = last;
        this.remainingItems = remainingItems;
    }
}
exports.PCV = PCV;
class Collection {
    constructor(id, members, views) {
        this.id = id;
        this.members = members;
        this.views = views;
    }
}
exports.Collection = Collection;
//# sourceMappingURL=HydraConstructor.js.map