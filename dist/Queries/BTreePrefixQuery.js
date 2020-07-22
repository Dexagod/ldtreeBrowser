"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BTreeQuery_1 = require("./BTreeQuery");
const Normalizer_1 = require("./Normalizer");
// const normalizeString = function(e : string) {return e.toLowerCase()}
const normalizeString = function (e) { return Normalizer_1.Normalizer.normalize(e); };
/**
 *
 * IMPORTANT NOTICE
 * Addresses are saved as strings, not numbers
 * because there are sometimes weird addresses like 21A.
 *
 */
class BTreePrefixQuery extends BTreeQuery_1.BTreeQuery {
    checkFollowInterval(interval, value) {
        value = normalizeString(value);
        let intervalltstring = interval['lt'] === undefined ? undefined : normalizeString(interval['lt']);
        let intervalltestring = interval['lte'] === undefined ? undefined : normalizeString(interval['lte']);
        let intervalgtestring = interval['gte'] === undefined ? undefined : normalizeString(interval['gte']);
        let intervalgtstring = interval['gt'] === undefined ? undefined : normalizeString(interval['gt']);
        if ((intervalltstring === undefined || value.localeCompare(intervalltstring) < 0 || intervalltstring.startsWith(value)) &&
            (intervalltestring === undefined || value.localeCompare(intervalltestring) <= 0 || intervalltestring.startsWith(value)) &&
            (intervalgtestring === undefined || value.localeCompare(intervalgtestring) >= 0 || intervalgtestring.startsWith(value)) &&
            (intervalgtstring === undefined || value.localeCompare(intervalgtstring) >= 0 || intervalgtstring.startsWith(value))) {
            return true;
        }
        return false;
    }
}
exports.BTreePrefixQuery = BTreePrefixQuery;
//# sourceMappingURL=BTreePrefixQuery.js.map