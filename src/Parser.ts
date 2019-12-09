import { TreeConstructor } from './Helpers/TreeConstructor';
let fetcher = require('ldfetch')

export class Parser{
  private ldfetch = new fetcher({})
  // private treeConstructor = new TreeConstructor()
  async process(id : string){
    let triples = (await this.ldfetch.get(id)).triples
    // return this.treeConstructor.getTreeProperties(triples)
    return new TreeConstructor().getTreeProperties(triples)
  }

  
}