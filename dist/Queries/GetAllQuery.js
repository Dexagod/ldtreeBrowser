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
class GetAllQuery extends Query_1.Query {
    constructor() {
        super(...arguments);
        this.foundLocations = [];
    }
    followChildRelations(nodeId, nodesMetadata, value, followedValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            let runningQueries = new Array();
            for (let node of nodesMetadata) {
                for (let relation of node.relations) {
                    runningQueries.push(/*await*/ yield this.followChildWithValue(relation.node, relation.value, value, level));
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
            return yield this.recursiveQueryNode(relationNodeId, searchValue, relationValue, level);
        });
    }
}
exports.GetAllQuery = GetAllQuery;
//# sourceMappingURL=GetAllQuery.js.map