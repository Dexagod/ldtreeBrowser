"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WKTStringQuery = void 0;
const Query_1 = require("./Query");
const terraformer = require('terraformer');
const terraformerparser = require('terraformer-wkt-parser');
const EventEmitter = require('events');
class WKTStringQuery extends Query_1.Query {
    followChildRelations(nodeId, nodesMetadata, value, followedValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            let runningQueries = [];
            for (let node of nodesMetadata) {
                if (node.id === nodeId) {
                    for (let relation of node.relations) {
                        if (relation.type === "https://w3id.org/tree#GeospatiallyContainsRelation") {
                            runningQueries.push(/*await*/ yield this.followChildWithValue(relation.node, relation.value, value, level));
                        }
                    }
                }
            }
            yield Promise.all(runningQueries);
            let returnlist = new Array();
            for (let list of yield runningQueries) {
                returnlist = returnlist.concat(yield list);
            }
            return returnlist;
        });
    }
    followChildWithValue(relationNodeId, relationValue, searchValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            let childValue = terraformerparser.parse(relationValue);
            if (this.isContained(childValue, searchValue) || this.isOverlapping(childValue, searchValue)) {
                return yield this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level);
            }
            else {
                return [];
            }
        });
    }
    bboxContainsPoint(bbox, pointCoordinates) {
        if ((bbox[0] <= pointCoordinates[0] && pointCoordinates[0] <= bbox[2]) &&
            (bbox[1] <= pointCoordinates[1] && pointCoordinates[1] <= bbox[3])) {
            return true;
        }
        return false;
    }
    isContained(container, contined_object) {
        // if (childGeoObject instanceof terraformer.Point)  { return false } // Point cannot contain other polygon or point
        try {
            if (!container.contains(contined_object)) {
                let bbox = container.bbox();
                if (contined_object instanceof terraformer.Point) {
                    return this.bboxContainsPoint(bbox, contined_object.coordinates);
                }
                else if (contined_object instanceof terraformer.Polygon) {
                    for (let coordinate of contined_object.coordinates[0]) {
                        if (!this.bboxContainsPoint(bbox, coordinate)) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            }
            else {
                return true;
            }
        }
        catch (err) {
            return false;
        }
    }
    isOverlapping(containerObject, containedObject) {
        try {
            return (new terraformer.Primitive(containerObject).intersects(containedObject));
        }
        catch (err) {
            return false;
        }
    }
}
exports.WKTStringQuery = WKTStringQuery;
//# sourceMappingURL=WKTStringQuery.js.map