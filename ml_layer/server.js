import DistributedStream from 'distributed-stream/src/DistributedStream';
import es from 'event-stream';
import path from 'path';
import socketio from 'socket.io';
import EventEmitter from 'events';
import ParameterMatrix from './src/ParameterMatrix';
import {partition, initialData, guard, parameters, hyperparameters} from './examples/matrixfactorization/MatrixFactorization';

// Set up a basic server serving a single page
const express = require('express')
const app = express()
const port = 3000;
const httpServer = app.listen(port);

app.use(express.static(path.join(__dirname, '/')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const socket = socketio(httpServer, { serveClient: false });

const distributedStream = new DistributedStream({socket, initialData});

const e = new EventEmitter();
const f = function(totalTimesteps, callback) {
  // Returns promise which is resolved when "new timestep" event is emitted.
  // This means the next jobs can be pushed to the DistributedStream
  return e.once("new timestep", startNewIteration.bind(this, totalTimesteps, callback));
}

const startNewIteration = function(totalTimesteps, callback) {
  // stop producing partitions if we plateau-ed
  if(guard(totalTimesteps)){
    socket.emit('finish');
    console.log("Finished.");
    return this.emit('end');
  }

  let partitions = partition(parameters, hyperparameters.workerCount, totalTimesteps);
  partitions.map(x => this.emit("data", x));

  callback();
}

// updates the matrix with results, triggers a new timestep if the current one is over
const handleResult = function(result) {
  for(const [key, value] of Object.entries(result.parameters)) {
    let paramMatrix = ParameterMatrix.parse(value);
    parameters[key].updateSubset(paramMatrix);
  }

  // current timestep is all processed
  if(result.partitionIdx[0] === hyperparameters.workerCount - 1) {
    e.emit("new timestep");
  }
};

// Connect the stream
es.readable(f).pipe(distributedStream).on("data", handleResult);

setTimeout(() => e.emit("new timestep"), 100);