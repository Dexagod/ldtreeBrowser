"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNNQuery = void 0;
const Query_1 = require("./Query");
class KNNQuery extends Query_1.Query {
    constructor() {
        super(...arguments);
        this.foundLocations = [];
    }
    followChildRelations(nodeId, nodesMetadata, value, followedValue, level) {
        throw new Error("Method not implemented.");
    }
    followChildWithValue(relationNodeId, relationValue, searchValue, level) {
        throw new Error("Method not implemented.");
    }
}
exports.KNNQuery = KNNQuery;
//# sourceMappingURL=KNNQuery.js.map