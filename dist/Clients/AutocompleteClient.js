"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
const Normalizer_1 = require("../Queries/Normalizer");
class AutocompleteClient extends Client_1.Client {
    constructor() {
        super(...arguments);
        // normalizeString = function(e:string) { return e.toLowerCase() } 
        this.normalizeString = function (e) { return Normalizer_1.Normalizer.normalize(e); };
    }
    filterValue(value, searchValue) {
        return this.normalizeString(value).startsWith(searchValue) ? true : false;
    }
    convertSearchValue(value) {
        return this.normalizeString(value);
    }
    reset() { }
}
exports.AutocompleteClient = AutocompleteClient;
//# sourceMappingURL=AutocompleteClient.js.map