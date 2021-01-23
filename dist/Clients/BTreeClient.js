"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BTreeClient = void 0;
const Client_1 = require("./Client");
class BTreeClient extends Client_1.Client {
    filterValue(value, searchValue) {
        return value === searchValue ? true : false;
    }
    reset() { }
}
exports.BTreeClient = BTreeClient;
//# sourceMappingURL=BTreeClient.js.map