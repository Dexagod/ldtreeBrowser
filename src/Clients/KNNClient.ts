import { Client } from './Client';
export class KNNClient extends Client {
  filterValue(quad: any, searchValue: any): boolean {
    return true;
  }

  reset(){ }
}