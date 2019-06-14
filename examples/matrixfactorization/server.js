const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path'),
  socketio = require('socket.io'),
  EventEmitter = require('events'),
  MatrixFactorization = require('./MatrixFactorization'),
  Partitioner = require('./Partitioner'),
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


let initialData = {};
let dataPartitions = Partitioner.partitionDataMatrixFactorization(MF.data, MF.userCount, MF.movieCount, MF.workerCount);
Object.keys(dataPartitions).map((x) => dataPartitions[x] = [...dataPartitions[x]]);

initialData.data = dataPartitions;
initialData.hyperparameters = Object.entries(MF.hyperparameters);

const distributedStream = new DistributedStream({
  socket,
  initialData
});

const f2 = function(count, callback) {
  const loss = MF.loss();
  console.log(`Iteration: ${iteration}, Timestep: ${timestep}, Loss: ${loss}`);

    // stop producing partitions if we plateu-ed
    if(!timestep && Math.abs(loss - lastLoss) < threshold){
      socket.emit('finish');
      console.log("Finished.");
      return this.emit('end');
    }

    let paramPartitions = Partitioner.partitionParamsMatrixFactorization(MF.data, MF.parameters.W, MF.parameters.H, MF.workerCount, timestep);

    for(let W_idx = 0; W_idx < MF.workerCount; W_idx++) {
      let job = {};
      let H_idx = (W_idx + timestep) % MF.workerCount;

      job.parameters = paramPartitions[W_idx];
      job.partition = [W_idx, H_idx];

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
const handleResult = (result) =>  {
  for(const [key, value] of Object.entries(result.parameters)) {
    let paramMatrix = ParameterMatrix.parse(value);
    MF.parameters[key].updateSubset(paramMatrix);
  }

  // current timestep is all processed
  if(result.partition[0] === MF.workerCount - 1) {
    e.emit("new timestep");
  }
};

// Connect the stream
es.readable(f).pipe(distributedStream).on("data", handleResult);

setTimeout(() => e.emit("new timestep"), 100);