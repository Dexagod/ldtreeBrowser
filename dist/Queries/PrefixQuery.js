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
exports.PrefixQuery = void 0;
const Query_1 = require("./Query");
const Normalizer_1 = require("./Normalizer");
// const normalizeString = function(e : string) {return e.toLowerCase()}
const normalizeString = function (e) { return Normalizer_1.Normalizer.normalize(e); };
class PrefixQuery extends Query_1.Query {
    //todo:: being able to continue querying on nodes that are stored in the session.
    followChildRelations(nodeId, nodesMetadata, value, followedValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            let runningQueries = new Array();
            for (let node of nodesMetadata) {
                if (node.id === nodeId) {
                    for (let relation of node.relations) {
                        let normalizedPrefixString = normalizeString(value);
                        let normalizedRelationValue = normalizeString(relation.value);
                        if (relation.type === "https://w3id.org/tree#PrefixRelation" && (normalizedPrefixString.startsWith(normalizedRelationValue) || normalizedRelationValue.startsWith(normalizedPrefixString))) {
                            runningQueries.push(/*await*/ this.followChildWithValue(relation.node, relation.value, value, level));
                        }
                        else if (relation.type === "https://w3id.org/tree#EqualThanRelation" && normalizedPrefixString === normalizedRelationValue) {
                            runningQueries.push(/*await*/ this.followChildWithValue(relation.node, relation.value, value, level));
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
            let normalizedPrefixString = normalizeString(searchValue);
            let normalizedRelationValue = normalizeString(relationValue);
            if (normalizedPrefixString.startsWith(normalizedRelationValue) || normalizedRelationValue.startsWith(normalizedPrefixString)) {
                return this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level);
            }
            else if (searchValue === relationValue) {
                return this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level);
            }
            else {
                return [];
            }
        });
    }
    getInitialSearchValue() {
        return "";
    }
}
exports.PrefixQuery = PrefixQuery;
//# sourceMappingURL=PrefixQuery.js.map