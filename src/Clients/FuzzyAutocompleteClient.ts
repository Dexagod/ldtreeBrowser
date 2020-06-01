import { Client } from './Client';
import { Normalizer } from '../Queries/Normalizer';
import { Query } from '../Queries/Query';
import { QuadConverter } from './Converter/QuadConverer';
const normalizeString = function(e : string) { return Normalizer.normalize(e) }

const defaultN = 2;
const defaultK = 20;

export class FuzzyAutocompleteClient extends Client {
  
  K: number;
  N: number;
  topNMembers : Array<EmitObject> = [];
  constructor(K = defaultK, N = defaultN){
    super();
    this.K = K;
    this.N = N;
  }

  filterValue(value: any, searchValue: any): boolean {
    let nsvalues = normalizeString(searchValue).split(" ")
    let nrvalue = normalizeString(value)
    for (let nsvalue of nsvalues) {
      if(nsvalue.includes(nrvalue) || nrvalue.includes(nsvalue)){
        return true;
      }
    }
    return false;
  }



  async handleEmitData(query: Query, data: any, shaclpath: Array<string>, searchValue: any, collectionId: string) {

    let ids = new Set(this.topNMembers.map(e => e.id));
    // this.emit('data', data.quads)
    let converter = new QuadConverter()
    await converter.processQuads(data.quads)

    let newTopMembers = []

    console.log("EMIT DATA")

    let scores = this.topNMembers.map(e=>e.score)
    let minScore = scores.length ? Math.min( ...scores ) : 0;
    // console.log("minscore", minScore)
    for (let quad of data.quads){
      let subjectId = converter.getIdOrValue(quad.subject)
      // this.allItems.add(subject)
      if (!ids.has(subjectId) && converter.getIdOrValue(quad.predicate) === shaclpath[0]) { // TODO => place matching library here
        let value = converter.getIdOrValue(quad.object);
        if (value) {
          ids.add(subjectId)
          let score = this.getNGramScore(Normalizer.normalize(searchValue), Normalizer.normalize(value))
          if(score > minScore){
            let scoringObject : EmitObject = {
              id: subjectId,
              value: value,
              object: converter.getAllConnectedItemsForId(subjectId),
              score: score,
            }
            newTopMembers.push(scoringObject)
          }
        }
      }
    }
    if(newTopMembers.length === 0) {
      return;
    }
    this.topNMembers = this.topNMembers.concat(newTopMembers).sort(function(a, b) {
        return b.score - a.score;
      }).slice(0, this.K)
    this.emit("topn", this.topNMembers)
  }

  getNGramScore(searchString: string, resultString: string){
    let searchStringNgrams = this.getNgrams(searchString, this.N)
    let matchCount = 0

    for (const ngram of searchStringNgrams){
      if (resultString.includes(ngram)){
        matchCount += 1;
      }
    }
    return matchCount / searchStringNgrams.length
  }
  

  getNgrams(value: string, n: number): string[]{
    let results = []
    for (let i = 0; i < value.length - n +1; i++) {results.push(value.substring(i, i+n))}
    return results;
  }

  reset(){ 
    this.topNMembers = [];
  }

}

interface EmitObject {
  id: string,
  value: string,
  object: any,
  score: number,
}