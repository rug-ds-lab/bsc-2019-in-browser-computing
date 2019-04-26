const distClient = require('../../src/DistributedSystem').Client;

const workFunction = (data, callback) => {
  return callback(data+1);
};

const c = new distClient({
    host: "localhost",
    port: 3000,
    debug: true,
    workFunction 
  });

c.connect();