"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
const Normalizer_1 = require("../Queries/Normalizer");
const QuadConverer_1 = require("./Converter/QuadConverer");
var stringSimilarity = require('string-similarity');
const normalizeString = function (e) { return Normalizer_1.Normalizer.normalize(e); };
const defaultN = 2;
const defaultK = 20;
class FuzzyAutocompleteClient extends Client_1.Client {
    constructor(K = defaultK, N = defaultN) {
        super();
        this.topNMembers = [];
        this.K = K;
        this.N = N;
    }
    filterValue(value, searchValue) {
        let nsvalues = normalizeString(searchValue).split(" ");
        let nrvalue = normalizeString(value);
        for (let nsvalue of nsvalues) {
            if (nsvalue.includes(nrvalue) || nrvalue.includes(nsvalue)) {
                return true;
                var similarity = stringSimilarity.compareTwoStrings('healed', 'sealed');
            }
        }
        return false;
    }
    handleEmitData(query, data, shaclpath, searchValue, collectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            let ids = new Set(this.topNMembers.map(e => e.id));
            // this.emit('data', data.quads)
            let converter = new QuadConverer_1.QuadConverter();
            yield converter.processQuads(data.quads);
            let newTopMembers = [];
            console.log("EMIT DATA");
            let scores = this.topNMembers.map(e => e.score); // Get the current list of scores from the present TOPN 
            let minScore = scores.length ? Math.min(...scores) : 0; // Get the minimum score to beat
            for (let quad of data.quads) {
                let subjectId = converter.getIdOrValue(quad.subject);
                // this.allItems.add(subject)
                if (!ids.has(subjectId) && converter.getIdOrValue(quad.predicate) === shaclpath[0]) { // TODO => place matching library here
                    let value = converter.getIdOrValue(quad.object);
                    if (value) {
                        ids.add(subjectId);
                        // let score = this.getNGramScore(Normalizer.normalize(searchValue), Normalizer.normalize(value))
                        let score = stringSimilarity.compareTwoStrings(Normalizer_1.Normalizer.normalize(searchValue), Normalizer_1.Normalizer.normalize(value));
                        if (score > minScore) {
                            let scoringObject = {
                                id: subjectId,
                                value: value,
                                object: converter.getAllConnectedItemsForId(subjectId),
                                score: score,
                            };
                            newTopMembers.push(scoringObject);
                        }
                    }
                }
            }
            if (newTopMembers.length === 0) {
                return;
            }
            this.topNMembers = this.topNMembers.concat(newTopMembers).sort(function (a, b) {
                return b.score - a.score;
            }).slice(0, this.K);
            this.emit("topn", this.topNMembers);
        });
    }
    getNGramScore(searchString, resultString) {
        let searchStringNgrams = this.getNgrams(searchString, this.N);
        let matchCount = 0;
        for (const ngram of searchStringNgrams) {
            if (resultString.includes(ngram)) {
                matchCount += 1;
            }
        }
        return matchCount / searchStringNgrams.length;
    }
    getNgrams(value, n) {
        let results = [];
        for (let i = 0; i < value.length - n + 1; i++) {
            results.push(value.substring(i, i + n));
        }
        return results;
    }
    reset() {
        this.topNMembers = [];
    }
}
exports.FuzzyAutocompleteClient = FuzzyAutocompleteClient;
//# sourceMappingURL=FuzzyAutocompleteClient.js.map