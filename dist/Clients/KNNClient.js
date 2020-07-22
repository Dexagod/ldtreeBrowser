"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
class KNNClient extends Client_1.Client {
    filterValue(quad, searchValue) {
        return true;
    }
    reset() { }
}
exports.KNNClient = KNNClient;
//# sourceMappingURL=KNNClient.js.map