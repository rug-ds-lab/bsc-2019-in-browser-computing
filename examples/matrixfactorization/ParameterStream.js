'use strict';

const stream = require('stream');

const MatrixFactorization = require('./MatrixFactorization');
const Partitioner = require('./Partitioner');


class ParameterStream extends stream.Duplex {
    constructor(options) {
      super(options);

      this.MF = new MatrixFactorization();
      this.maxIterations = 2000;
      this.iterations = 0;
      this.timestep = 0;
    }

    _read(size) {
      //check if the current timestep is all sent, but not received back
      if(){
        return this.once("new timestep", _read.bind(this, size));
      }

      console.log("Iteration:", this.iterations, "Timestep:", this.timestep, "\tLoss: ", this.MF.loss());

      if(this.iterations > this.maxIterations) {
        return this.emit('end');
      }

      let depvecs = [];
      let partitions = Partitioner.partitionDummy(
        [this.MF.ratings, this.MF.W, this.MF.H], depvecs,
        this.MF.workerCount,
        this.MF.userCount,
        this.MF.movieCount,
        this.MF.featureCount);

      for(let idx = 0; idx < this.MF.workerCount; idx++) {
        partitions[this.timestep]['parts'][idx]['partition'] = idx;
        this.push(JSON.stringify(partitions[this.timestep]['parts'][idx]));
      }
      this.iterations++; //TODO: Remove this 
    }
    
    _write(chunk, _encoding, callback) {
      let data = JSON.parse(chunk);
      this.MF.W.updateSubset(data['W_partition']);
      this.MF.H.updateSubset(data['H_partition']);

      // current timestep is all processed
      if(data.partition === this.MF.workerCount - 1) {
        this.emit("new timestep");
      }
      callback();
    }
}

module.exports = ParameterStream;