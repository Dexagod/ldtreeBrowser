"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
class GetAllClient extends Client_1.Client {
    filterValue(value, searchValue) {
        return true;
    }
    convertSearchValue(value) {
        return value;
    }
    reset() { }
}
exports.GetAllClient = GetAllClient;
//# sourceMappingURL=GetAllClient.js.map