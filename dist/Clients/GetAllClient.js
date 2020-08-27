"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllClient = void 0;
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