const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path'),
  socketio = require('socket.io'),
  EventEmitter = require('events'),
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
  threshold = 50,
  socket = socketio(httpServer);
  
let timestep = 0,
  iteration = 0,
  lastLoss = 0;

const distributedStream = new DistributedStream({socket});

const f2 = function(count, callback) {
  const loss = MF.loss();
  console.log(`Iteration: ${iteration}, Timestep: ${timestep}, Loss: ${loss}`);

  // stop producing partitions if we plateu-ed
  if(!timestep && Math.abs(loss - lastLoss) < threshold){
    socket.emit('finish')
    return this.emit('end');
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

  timestep = count % MF.workerCount;
  iteration = Math.floor(count / MF.workerCount);
  lastLoss = loss;

  callback();
}

const e = new EventEmitter();
const f = function(count, callback) {
  // Returns promise which is resolved when "new timestep" event is emitted.
  // This means the next jobs can be pushed to the DistributedStream
  socket.emit('counter', {iteration, timestep, lastLoss});
  return e.once("new timestep", f2.bind(this, count, callback));
}

// updates the matrix with results, triggers a new timestep if the current one is over
const handleResult = (data) =>  {

  // let data = chunk;
  // console.log(data);
  MF.W.updateSubset(data.W_partition, data.W_partition.begin_m, data.W_partition.end_m, 0, MF.featureCount);
  MF.H.updateSubset(data.H_partition, data.H_partition.begin_m, data.H_partition.end_m, 0, MF.featureCount);
  // MF.W.updateSubset(data.W_partition);
  // MF.H.updateSubset(data.H_partition);

  // current timestep is all processed
  if(data.partition === MF.workerCount - 1) {
    e.emit("new timestep");
  }
};

// Connect the stream to eachother
es.readable(f).pipe(distributedStream).on("data", handleResult);

// e.emit("new timestep");
setTimeout(() => e.emit("new timestep"), 1000);