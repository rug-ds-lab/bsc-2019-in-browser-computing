const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path'),
  socketio = require('socket.io'),
  EventEmitter = require('events'),
  MatrixFactorization = require('./MatrixFactorization'),
  Partitioner = require('./Partitioner');
  ParameterMatrix = require('./ParameterMatrix');


// Set up a basic server serving a single page
const express = require('express')
const app = express()

const port = 3000;

const httpServer = app.listen(port);

app.use(express.static(path.join(__dirname, '../../')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const MF = new MatrixFactorization(),
  threshold = 0.001,
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
    socket.emit('finish');
    console.log("Finished.");
    return this.emit('end');
  }

    let paramPartitions = Partitioner.partitionParamsMatrixFactorization(MF.ratings, MF.W, MF.H, MF.workerCount, timestep);
    let dataPartitions = Partitioner.partitionDataMatrixFactorization(MF.ratings, MF.userCount, MF.movieCount, MF.workerCount);

    for(let W_idx = 0; W_idx < MF.workerCount; W_idx++) {
      let job = {};
      let H_idx = (W_idx + timestep) % MF.workerCount;

      job.data_partition = [...dataPartitions[[W_idx, H_idx].toString()]];
      job.param_partitions = paramPartitions[W_idx];
      job.partition = W_idx;
      job.hyperparameters = {'learningRate': MF.learningRate, 'beta': MF.beta, 'featureCount': MF.featureCount};

      this.emit("data", job);
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

  let W = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(data.W_partition));
  W.data = new Float32Array(Object.values(data.W_partition.data));

  let H = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(data.H_partition));
  H.data = new Float32Array(Object.values(data.H_partition.data));

  MF.W.updateSubset(W);
  MF.H.updateSubset(H);

  // current timestep is all processed
  if(data.partition === MF.workerCount - 1) {
    e.emit("new timestep");
  }
};

// Connect the stream to eachother

es.readable(f).pipe(distributedStream).on("data", handleResult);

// e.emit("new timestep");
setTimeout(() => e.emit("new timestep"), 100);