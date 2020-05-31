import { Client } from './Client';

export class GetAllClient extends Client {
    filterValue(value: any, searchValue: any): boolean {
      return true;
    }
  
    convertSearchValue(value:any){
      return value;
    }
  }
  