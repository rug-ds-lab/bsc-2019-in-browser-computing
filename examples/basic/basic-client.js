const distClient = require('../../src/DistributedSystem').Client;

const findPrimeFactors = (num, callback) => {
    let factors = [];

    for (let i = 2; i <= num; i++) {
        while ((num % i) === 0) {
            factors.push(i);
            num /= i;
        }
    }
    
    return callback(null, factors);
};

new distClient({
    host: "http://localhost",
    port: 3000,
    debug: true,
    workFunction: findPrimeFactors
}).connect();
