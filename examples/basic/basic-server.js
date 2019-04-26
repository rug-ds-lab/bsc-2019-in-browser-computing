const distServer = require('../../src/DistributedSystem').Server;

// array of numbers [0..500]
const data = Array.from(new Array(500), (x,i) => i); 

const s = new distServer({
    port:3000,
    debug: true,
    data
  });

s.startServer();