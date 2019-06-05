const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path'),
  socketio = require('socket.io'),
  ParameterStream = require('./ParameterStream.js'),
  MatrixFactorization = require('./MatrixFactorization'),
  Partitioner = require('./Partitioner');


// Set up a basic server serving a single page
const express = require('express')
const app = express()
const port = 3000;

const httpServer = app.listen(port);

app.use(express.static(path.join(__dirname, '../../')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const MF = new MatrixFactorization(),
  maxIterations = 2000;
  
let timestep = 0;

// Create a ParameterStream:
// Works roughly like this currently:
// (updated parameters) -> paramStream -> (computationJobs) -> DistributedStream -> (updated parameters) -> paramStream
var paramStream = new ParameterStream(MF);
const distributedStream = new DistributedStream({socket: socketio(httpServer)});

const f2 = function(_count, callback) {
  console.log("Timestep:", timestep, "Loss: ", MF.loss());

  if(false) {
    return emit('end');
  }

  let depvecs = [];
  let partitions = Partitioner.partitionDummy(
    [MF.ratings, MF.W, MF.H], depvecs,
    MF.workerCount,
    MF.userCount,
    MF.movieCount,
    MF.featureCount);

  for(let idx = 0; idx < MF.workerCount; idx++) {
    partitions[timestep]['parts'][idx]['partition'] = idx;
    this.emit("data", partitions[timestep]['parts'][idx]);
  }
  timestep = (timestep + 1) % MF.workerCount; //TODO: Remove this 
  callback();
}

const f = function(_count, callback) {
  // Returns promise which is resolved when "new timestep" event is emitted.
  // This means the next jobs can be pushed to the DistributedStream
  return paramStream.once("new timestep", f2.bind(this, _count, callback));
}


// Connect the stream to eachother
es.readable(f).pipe(distributedStream).pipe(paramStream);

// paramStream.emit("new timestep");
setTimeout(() => paramStream.emit("new timestep"), 1000);