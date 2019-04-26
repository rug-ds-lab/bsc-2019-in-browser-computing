const distServer = require('../../src/DistributedSystem').Server;

// array of numbers [0..100000]
const data = Array.from(new Array(100000), (x,i) => i); 

const s = new distServer({
    port:3000,
    debug: true,
    data
  });

s.startServer();