"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
const wktparser = require("terraformer-wkt-parser");
const terraformer = __importStar(require("terraformer"));
class WKTClient extends Client_1.Client {
    filterValue(value, searchValue) {
        value = wktparser.parse(value);
        // searchValue = wktparser.parse(searchValue)
        if (this.isContained(searchValue, value) || this.isContained(value, searchValue) || this.isOverlapping(value, searchValue)) {
            return true;
        }
        return false;
    }
    isContained(contained_object, container) {
        // if (childGeoObject instanceof terraformer.Point)  { return false } // Point cannot contain other polygon or point
        try {
            if (!container.contains(contained_object)) {
                let bbox = container.bbox();
                if (contained_object instanceof terraformer.Point) {
                    return this.bboxContainsPoint(bbox, contained_object.coordinates);
                }
                else if (contained_object instanceof terraformer.Polygon) {
                    for (let coordinate of contained_object.coordinates[0]) {
                        if (!this.bboxContainsPoint(bbox, coordinate)) {
                            return false;
                        }
                    }
                    return true;
                }
                return false;
            }
            else {
                return true;
            }
        }
        catch (err) {
            return false;
        }
    }
    bboxContainsPoint(bbox, pointCoordinates) {
        if ((bbox[0] <= pointCoordinates[0] && pointCoordinates[0] <= bbox[2]) &&
            (bbox[1] <= pointCoordinates[1] && pointCoordinates[1] <= bbox[3])) {
            return true;
        }
        return false;
    }
    isOverlapping(dataGeoObject, childGeoObject) {
        if (childGeoObject instanceof terraformer.Point || dataGeoObject instanceof terraformer.Point) {
            return false;
        } // Point cannot contain other polygon or point
        let childWKTPrimitive = new terraformer.Primitive(childGeoObject);
        try {
            return (childWKTPrimitive.intersects(dataGeoObject));
        }
        catch (err) {
            return false;
        }
    }
    convertSearchValue(value) {
        return wktparser.parse(value);
    }
    reset() { }
}
exports.WKTClient = WKTClient;
//# sourceMappingURL=WKTClient.js.map