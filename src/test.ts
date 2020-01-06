const PromiseQueue = require("easy-promise-queue").default;



class Counter {
  lastPromise: any = null;
  pq = new PromiseQueue({
    concurrency: 1
  });

  count(i : any){
    let lastPromise = this.lastPromise
    this.pq.add(() => {
      console.log("")
      console.log("creating promise", i)
      let promise = new Promise(async function (resolve, reject) {
        if (lastPromise !== null){
          let lastPromiseValue = await lastPromise
          console.log("PREVIOUS TASK VALUE", lastPromiseValue)
        }
        setTimeout(function () {
          console.log('task', i);
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