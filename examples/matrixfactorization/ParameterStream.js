'use strict';

const stream = require('stream');

const MatrixFactorization = require('./MatrixFactorization');
const Partitioner = require('./Partitioner');


class ParameterStream extends stream.Transform {
    constructor(options) {
      super(options);

      this.MF = new MatrixFactorization();
      this.maxIterations = 1000;
      this.iterations = 0;
      this.timestep = 0;
    }

    _transform(chunk, _encoding, callback) {
        let data = JSON.parse(chunk);
        if(Object.keys(data).length != 0) {

          data.map((processedData) => {
            this.MF.W.updateSubset(processedData['W_partition']);
            this.MF.H.updateSubset(processedData['H_partition']);
          });

          this.parameters = data;
          if(this.timestep < this.MF.workerCount - 1) {
            this.timestep++;
          } else {
            this.timestep = 0;
            this.iterations++;
          }
        }
        console.log("Iteration:", this.iterations, "Timestep:", this.timestep, "\tLoss: ", this.MF.loss());
        if(this.iterations < this.maxIterations) {
            let depvecs = [];
            let partitions = Partitioner.partitionDummy(
              [this.MF.ratings, this.MF.W, this.MF.H], depvecs,
              this.MF.workerCount,
              this.MF.userCount,
              this.MF.movieCount,
              this.MF.featureCount);
            this.emit('data', JSON.stringify(partitions[this.timestep]['parts']));

        } else {
          return this.emit('end')
        }

        callback();
    }
}

module.exports = ParameterStream;