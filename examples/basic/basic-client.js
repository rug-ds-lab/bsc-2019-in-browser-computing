const distClient = require('../../src/DistributedSystem').Client;

const findPrimeFactors = (num, callback) => {
    let factors = [];
    var originalNum = num;

    for (let i = 2; i <= num; i++) {
        while ((num % i) === 0) {
            factors.push(i);
            num /= i;
        }
    }
    
    return callback(null, {originalNum, factors});
};

const c = new distClient({
    host: "localhost",
    port: 3000,
    debug: true,
    workFunction: findPrimeFactors
  });

c.connect();