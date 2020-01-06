
import { BTreeQuery } from './BTreeQuery';
const normalizeString = function(e : string) {return e.toLowerCase()}
/**
 * 
 * IMPORTANT NOTICE
 * Addresses are saved as strings, not numbers
 * because there are sometimes weird addresses like 21A.
 * 
 */

export class BTreePrefixQuery extends BTreeQuery {  
    
  checkFollowInterval(interval : any, value: any){
    value = normalizeString(value)
    let intervalltstring = interval['lt'] === undefined ? undefined : normalizeString(interval['lt'])
    let intervalltestring = interval['lte'] === undefined ? undefined : normalizeString(interval['lte'])
    let intervalgtestring = interval['gte'] === undefined ? undefined : normalizeString(interval['gte'])
    let intervalgtstring = interval['gt'] === undefined ? undefined : normalizeString(interval['gt'])
    if ((intervalltstring === undefined || value.localeCompare(intervalltstring) < 0 || value.startsWith(intervalltstring) || intervalltstring.startsWith(value) ) &&
      (intervalltestring === undefined || value.localeCompare(intervalltestring) <= 0 || value.startsWith(intervalltestring) || intervalltestring.startsWith(value) ) &&
      (intervalgtestring === undefined || value.localeCompare(intervalgtestring) >= 0 || value.startsWith(intervalgtestring) || intervalgtestring.startsWith(value) ) &&
      (intervalgtstring === undefined || value.localeCompare(intervalgtstring) > 0 || value.startsWith(intervalgtstring) || intervalgtstring.startsWith(value) ) )
    {
      return true;
    }
    return false;
  }

}
