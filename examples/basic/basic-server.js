const distServer = require('../../src/Main').Server;

let i = 0;
const data = (callback) => {
  i++;
  if(i > 1000){
    return callback(new Error("End of data"));
  }
  return callback(null, i);
};

const server = new distServer({
    port:3000,
    data
});

server.on('data', (chunk) => {
  console.log(chunk);
});

server.on('end', () => {
  console.log("END");
});
