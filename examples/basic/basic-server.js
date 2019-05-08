const Server = require('../../src/DistributedSystem').Server,
  es = require('event-stream');

// Stream constructed from a function that simply counts from 0 till 1000
const dataStream = es.readable(function(i, callback)  {
  if(i > 1000){
    return this.emit('end')
  }
  return callback(null, i.toString());
});

// Stream that reads all its input into an array and console.logs it
const arrayWriter = es.writeArray(function(err, array){
  console.log(array);
});

const server = new Server({redundancy:2});

dataStream.pipe(server).pipe(arrayWriter);