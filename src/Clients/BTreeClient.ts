import { Client } from './Client';

export class BTreeClient extends Client {
  filterValue(value: any, searchValue: any): boolean {
    return value === searchValue ? true : false;
  }
}
