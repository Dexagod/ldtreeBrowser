import { Client } from './Client';
const wktparser = require("terraformer-wkt-parser")
import * as terraformer from 'terraformer'

export class WKTClient extends Client {
  filterValue(value: any, searchValue: any): boolean {
    value = wktparser.parse(value)
    // searchValue = wktparser.parse(searchValue)
    if (this.isContained(searchValue, value) || this.isContained(value, searchValue) || this.isOverlapping(value, searchValue)){
      return true
    } 
    return false;
  }
  

  private isContained(contained_object : any, container : any) : boolean {
    // if (childGeoObject instanceof terraformer.Point)  { return false } // Point cannot contain other polygon or point
    try {
      if (! container.contains(contained_object)){
        let bbox = container.bbox();
        if (contained_object instanceof terraformer.Point){
          return this.bboxContainsPoint(bbox, contained_object.coordinates)
        } else if (contained_object instanceof terraformer.Polygon){
          for (let coordinate of contained_object.coordinates[0]){
            if (! this.bboxContainsPoint(bbox, coordinate)){
              return false;
            }
          }
          return true
        }
        return false
      } else {
        return true;
      }
    } catch(err){
        return false;
    }
  }

  private bboxContainsPoint(bbox: any, pointCoordinates: any){
    if ((bbox[0] <= pointCoordinates[0] && pointCoordinates[0] <= bbox[2]) &&
    (bbox[1] <= pointCoordinates[1] && pointCoordinates[1] <= bbox[3])){
      return true;
    }
    return false;
  }


  private isOverlapping(dataGeoObject : terraformer.Polygon | terraformer.Point, childGeoObject : any) : boolean {
    if (childGeoObject instanceof terraformer.Point || dataGeoObject instanceof terraformer.Point)  { return false } // Point cannot contain other polygon or point
    let childWKTPrimitive = new terraformer.Primitive(childGeoObject)
    try {
      return (childWKTPrimitive.intersects(dataGeoObject))
    } catch(err){
        return false;
    }
  }
  convertSearchValue(value:any){
    return wktparser.parse(value);
  }

  reset(){ }
}
