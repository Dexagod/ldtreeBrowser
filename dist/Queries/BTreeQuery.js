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
const Query_1 = require("./Query");
class BTreeQuery extends Query_1.Query {
    followChildRelations(nodeId, nodesMetadata, value, level) {
        return __awaiter(this, void 0, void 0, function* () {
            if (value === null) {
                return [];
            }
            let runningQueries = [];
            for (let node of nodesMetadata) {
                if (node.id === nodeId) {
                    let relations = node.relations;
                    let intervalMap = this.extractRelationIntervals(relations);
                    for (let intervalEntry of Array.from(intervalMap.entries())) {
                        runningQueries.push(/*await*/ yield this.followChildWithValue(intervalEntry[0], intervalEntry[1], value, level));
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
            if (this.checkFollowInterval(relationValue, searchValue)) {
                return yield this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level);
            }
            else {
                return [];
            }
        });
    }
    extractRelationIntervals(relations) {
        let intervals = new Map();
        for (let relation of relations) {
            if (relation.type === "https://w3id.org/tree#LesserThanRelation") {
                this.addInterval(intervals, relation.node, "lt", relation.value);
            }
            else if (relation.type === "https://w3id.org/tree#LesserOrEqualThanRelation") {
                this.addInterval(intervals, relation.node, "lte", relation.value);
            }
            else if (relation.type === "https://w3id.org/tree#GreaterOrEqualThanRelation") {
                this.addInterval(intervals, relation.node, "gte", relation.value);
            }
            else if (relation.type === "https://w3id.org/tree#GreaterThanRelation") {
                this.addInterval(intervals, relation.node, "gt", relation.value);
            }
        }
        return intervals;
    }
    addInterval(intervalMap, node, predicate, value) {
        let interval = intervalMap.get(node);
        if (interval === undefined) {
            intervalMap.set(node, { [predicate]: value });
        }
        else {
            intervalMap.get(node)[predicate] = value;
        }
    }
    checkFollowInterval(interval, value) {
        if ((interval['lt'] === undefined || value.localeCompare(interval['lt']) < 0) &&
            (interval['lte'] === undefined || value.localeCompare(interval['lte']) <= 0) &&
            (interval['gte'] === undefined || value.localeCompare(interval['gte']) >= 0) &&
            (interval['gt'] === undefined || value.localeCompare(interval['gt']) > 0)) {
            return true;
        }
        return false;
    }
}
exports.BTreeQuery = BTreeQuery;
//# sourceMappingURL=BTreeQuery.js.map