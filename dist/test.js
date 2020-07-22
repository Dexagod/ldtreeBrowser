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
const PromiseQueue = require("easy-promise-queue").default;
class Counter {
    constructor() {
        this.lastPromise = null;
        this.pq = new PromiseQueue({
            concurrency: 1
        });
    }
    count(i) {
        let lastPromise = this.lastPromise;
        this.pq.add(() => {
            let promise = new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (lastPromise !== null) {
                        let lastPromiseValue = yield lastPromise;
                    }
                    setTimeout(function () {
                        resolve(i);
                    }, i * 100);
                });
            });
            this.lastPromise = promise;
            return promise;
        });
    }
}
let counter = new Counter();
for (let i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
    console.log("adding", i);
    counter.count(i);
}
// while (not_all_items_found){
//   for (item in page){
//     if (filter(item)){
//       emit (item)
//     }
//   }
//   page = page.next
// }
//# sourceMappingURL=test.js.map