"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNNClient = void 0;
const Client_1 = require("./Client");
class KNNClient extends Client_1.Client {
    filterValue(quad, searchValue) {
        return true;
    }
    reset() { }
}
exports.KNNClient = KNNClient;
//# sourceMappingURL=KNNClient.js.map