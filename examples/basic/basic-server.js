const distServer = require('../../src/DistributedSystem').Server;

let i = 0;
const data = (callback) => {
  i++;
  if(i > 1000000){
    return callback(new Error("End of data"));
  }
  return callback(null, i);
};

const s = new distServer({
    port:3000,
    debug: true,
    data
  });

s.startJobs((err, data) => {
  console.log(err || data);
});