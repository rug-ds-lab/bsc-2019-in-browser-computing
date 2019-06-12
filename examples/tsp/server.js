const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path'),
  socketio = require('socket.io'),
  TravellingSalesman = require('./TravellingSalesman.js');

// Set up a basic server serving a single page
const express = require('express')
const app = express()

const httpServer = app.listen(3000);

app.use(express.static(path.join(__dirname, '../../')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const ts = new TravellingSalesman(9);
const permutationStream = es.readable(function(_count, callback){
  const val = ts.generator.next();
  if(val.done){
    return this.emit('end');
  }
  return callback(null, val.value);
});

const distributedStream = new DistributedStream({
  socket: socketio(httpServer),
  initialData: ts.distances
});

let shortest = {distance:999999999};
permutationStream
  .pipe(distributedStream)
  .on('data', (data) => {
    if(data.distance < shortest.distance){
      shortest = data;
    }
  })
  .on('end', () => console.log(`Shortest route: ${shortest.permutation} with distance ${shortest.distance}`));

