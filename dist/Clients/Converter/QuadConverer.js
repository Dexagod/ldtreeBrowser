"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QuadConverter {
    constructor() {
        this.subjectMap = new Map();
        this.graphMap = new Map(); // Map<graphId, Set([id1, id2, ...]) with ids of items in the graph
        this.objectPerType = new Map(); // Map<typeName, Set([id1, id2, ...]) with ids of items with the given type
    }
    processQuads(quads) {
        if (quads === null || quads === undefined || quads.length === undefined || quads.length === 0) {
            return;
        }
        for (let quad of quads) {
            if (quad !== undefined && quad !== null) {
                // if (! this.checkQuadPresent(quad, this.subjectMap.get(this.getIdOrValue(quad.subject)))){
                this.addToListMap(this.subjectMap, this.getIdOrValue(quad.subject), quad);
                if (this.getIdOrValue(quad.predicate) === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                    this.addToSetMap(this.objectPerType, this.getIdOrValue(quad.object), this.getIdOrValue(quad.subject)); // Map<typename, [id1, id2, ...]>
                }
                if (quad.graph.termType === "BlankNode" || quad.graph.termType === "NamedNode") {
                    this.addToSetMap(this.graphMap, this.getIdOrValue(quad.graph), this.getIdOrValue(quad.subject));
                }
                // }
            }
        }
    }
    checkQuadPresent(quad, quadList) {
        for (let presentQuad of quadList) {
            // try{
            //   if (presentQuad.equals(quad)){
            //     return true
            //   }
            // } catch {
            if ((this.getIdOrValue(quad.object) === this.getIdOrValue(presentQuad.object)) &&
                (this.getIdOrValue(quad.predicate) === this.getIdOrValue(presentQuad.predicate)) &&
                (this.getIdOrValue(quad.graph) === this.getIdOrValue(presentQuad.graph)) &&
                (this.getIdOrValue(quad.subject) === this.getIdOrValue(presentQuad.subject))) {
                return true;
                // }
            }
        }
        return false;
    }
    getItemForId(id, connectOnlyBlankNodes = true) {
        if (!this.checkIdPresent(id)) {
            return { quads: [], jsonld: [] };
        }
        return this.getConnectedNodesForNode(id, connectOnlyBlankNodes);
    }
    checkIdPresent(id) {
        return this.subjectMap.get(id) !== undefined;
    }
    checkGraphIdPresent(id) {
        return this.graphMap.get(id) !== undefined;
    }
    getAvailableTypes() {
        return Array.from(this.objectPerType.keys());
    }
    getAvailableIds() {
        return Array.from(this.subjectMap.keys());
    }
    getAvailableGraphIds() {
        return Array.from(this.graphMap.keys());
    }
    checkItemContainedByGraph(itemId, graphId) {
        return this.graphMap.get(graphId).indexOf(itemId) !== -1;
    }
    getIndividualItemsForType(type, connectOnlyBlankNodes = true) {
        return this.getIndividualItemsForGraphOrType(this.objectPerType, type, connectOnlyBlankNodes);
    }
    getIndividualItemsForGraph(graphId, connectOnlyBlankNodes = true) {
        return this.getIndividualItemsForGraphOrType(this.graphMap, graphId, connectOnlyBlankNodes);
    }
    getIndividualItemsForGraphOrType(map, mapIdentifier, connectOnlyBlankNodes = true) {
        let returnMap = new Map();
        if (!map.has(mapIdentifier)) {
            return null;
        }
        for (let id of map.get(mapIdentifier)) {
            returnMap.set(id, this.getItemForId(id, connectOnlyBlankNodes));
        }
        return returnMap;
    }
    getItemsForType(type, connectOnlyBlankNodes = true) {
        return this.getAllItemsForGraphOrType(this.objectPerType, type, connectOnlyBlankNodes);
    }
    getItemsForGraph(graphId, connectOnlyBlankNodes = true) {
        return this.getAllItemsForGraphOrType(this.graphMap, graphId, connectOnlyBlankNodes);
    }
    getAllItemsForGraphOrType(map, mapIdentifier, connectOnlyBlankNodes = true) {
        let objectList = new Array();
        let quadList = new Array();
        for (let id of map.get(mapIdentifier)) {
            let itemReturnWrapper = this.getItemForId(id, connectOnlyBlankNodes);
            objectList = objectList.concat(itemReturnWrapper.jsonld);
            quadList = quadList.concat(itemReturnWrapper.quads);
        }
        let returnWrapper = {
            quads: quadList,
            jsonld: objectList
        };
        return returnWrapper;
    }
    getConnectedBlankNodesForId(id) {
        return this.getConnectedNodesForNode(id, true);
    }
    getConnectedNodesForNode(id, onlyBlank, passedIds = new Array()) {
        let node = { "id": id };
        let quadsList = Array();
        if (passedIds.indexOf(id) !== -1) {
            let returnWrapper = {
                quads: quadsList,
                jsonld: node
            };
            return returnWrapper;
        }
        else {
            passedIds = passedIds.concat(id);
        }
        if (this.graphMap.has(id)) {
            let allItemsForGraph = this.getItemsForGraph(id, onlyBlank);
            node["@graph"] = allItemsForGraph.jsonld;
            quadsList = quadsList.concat(allItemsForGraph.quads);
        }
        if (this.subjectMap.has(id)) {
            for (let quad of this.subjectMap.get(id)) {
                if (!this.checkQuadPresent(quad, quadsList)) {
                    quadsList.push(quad);
                    let predicateValue = this.getIdOrValue(quad.predicate);
                    if ((onlyBlank === true && quad.object.termType === "BlankNode") || (onlyBlank === false && (quad.object.termType === "NamedNode" || quad.object.termType === "BlankNode"))) {
                        let nodeReturnWrapper = this.getConnectedNodesForNode(this.getIdOrValue(quad.object), onlyBlank, passedIds);
                        quadsList = quadsList.concat(nodeReturnWrapper.quads);
                        if (node.hasOwnProperty(predicateValue)) {
                            node[predicateValue].push(nodeReturnWrapper.jsonld);
                        }
                        else {
                            node[predicateValue] = [nodeReturnWrapper.jsonld];
                        }
                    }
                    else {
                        if (node.hasOwnProperty(predicateValue)) {
                            node[predicateValue].push(quad.object);
                        }
                        else {
                            node[predicateValue] = [quad.object];
                        }
                    }
                }
            }
        }
        let returnWrapper = {
            quads: quadsList,
            jsonld: node
        };
        return returnWrapper;
    }
    getAllConnectedItemsForId(id) {
        return this.getConnectedNodesForNode(id, false);
    }
    getIdOrValue(object) {
        if (object.hasOwnProperty("id")) {
            return object["id"];
        }
        else if (object.hasOwnProperty("value")) {
            return object["value"];
        }
        else {
            throw new Error("Triple " + object + " contains no id or value field");
        }
    }
    addToSetMap(setMap, key, value) {
        if (setMap.has(key)) {
            setMap.get(key).add(value);
        }
        else {
            setMap.set(key, new Set([value]));
        }
    }
    addToListMap(setMap, key, value) {
        if (setMap.has(key)) {
            setMap.get(key).push(value);
        }
        else {
            setMap.set(key, new Array(value));
        }
    }
}
exports.QuadConverter = QuadConverter;
//# sourceMappingURL=QuadConverer.js.map