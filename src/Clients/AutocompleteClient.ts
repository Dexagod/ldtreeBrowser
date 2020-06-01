import { Client } from './Client';
import { Normalizer } from '../Queries/Normalizer';

export class AutocompleteClient extends Client {
  filterValue(value: any, searchValue: any): boolean {
    return this.normalizeString(value).startsWith(searchValue) ? true : false;
  }
  // normalizeString = function(e:string) { return e.toLowerCase() } 
  normalizeString = function(e : string) { return Normalizer.normalize(e) }

  convertSearchValue(value:any){
    return this.normalizeString(value);
  }

  reset(){ }
}
