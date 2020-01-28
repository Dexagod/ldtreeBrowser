const PromiseQueue = require("easy-promise-queue").default;



class Counter {
  lastPromise: any = null;
  pq = new PromiseQueue({
    concurrency: 1
  });

  count(i : any){
    let lastPromise = this.lastPromise
    this.pq.add(() => {
      let promise = new Promise(async function (resolve, reject) {
        if (lastPromise !== null){
          let lastPromiseValue = await lastPromise
        }
        setTimeout(function () {
          resolve(i);
        }, i * 100)
      });
      this.lastPromise = promise;
      return promise
    });
  }
}



let counter = new Counter();
for (let i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]) {
  console.log("adding", i)
  counter.count(i)
  
}

// while (not_all_items_found){
//   for (item in page){
//     if (filter(item)){
//       emit (item)
//     }
//   }
//   page = page.next
// }
