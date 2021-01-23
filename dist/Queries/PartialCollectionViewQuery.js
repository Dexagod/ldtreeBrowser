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
exports.PartialCollectionViewQuery = void 0;
const Query_1 = require("./Query");
class PartialCollectionViewQuery extends Query_1.Query {
    //todo:: being able to continue querying on nodes that are stored in the session.
    followChildWithValue(relationNodeId, relationValue, searchValue, level) {
        return __awaiter(this, void 0, void 0, function* () {
            let nextUrl = relationValue;
            if (!nextUrl.startsWith("http")) {
                if (this.baseURI === null) {
                    throw new Error("Please pass a base-uri to the contructor of the query.");
                }
                else {
                    nextUrl = this.baseURI + nextUrl;
                }
            }
            return yield this.recursiveQueryNode(nextUrl, searchValue, relationValue, level);
        });
    }
    followChildRelations(nodeId, nodesMetadata, value, level) {
        return __awaiter(this, void 0, void 0, function* () {
            let runningQueries = [];
            if (value === null) {
                return [];
            }
            let nodes = new Array();
            for (let node of nodesMetadata) {
                if (node.next !== undefined && node.next !== null) {
                    runningQueries.push(yield this.followChildWithValue(null, node.next, value, level));
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
    // async processId(id : any){
    //   if (this.terminated || this.processedIds.indexOf(id) !== -1) { return null }
    //   return await this.parser.processHydra(id)
    // }
    processIdTask(id, query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query.terminated /*|| query.processedIds.indexOf(id) !== -1*/) {
                return null;
            }
            let processed = yield query.parser.process(id);
            query.processedIds.push(id);
            return processed;
        });
    }
}
exports.PartialCollectionViewQuery = PartialCollectionViewQuery;
//# sourceMappingURL=PartialCollectionViewQuery.js.map