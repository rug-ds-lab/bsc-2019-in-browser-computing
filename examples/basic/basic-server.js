const distServer = require('../../src/DistributedSystem').Server;

let i = 0;
const data = (callback) => {
  i++;
  if(i > 1000){
    return callback(new Error("End of data"));
  }
  return callback(null, i);
};

const s = new distServer({
    port:3000,
    data
  });

s.on('data', (chunk) => {
  console.log(chunk);
});

s.on('end', () => {
  console.log("END");
});