'use strict';

const stream = require('stream');

class ParameterStream extends stream.Writable {
    constructor(MF) {
      super({objectMode: true});
      this.MF = MF;
      this.lastPartition = this.MF.workerCount - 1;
    }

    _write(chunk, _encoding, callback) {
      let data = chunk;
      this.MF.W.updateSubset(data['W_partition']);
      this.MF.H.updateSubset(data['H_partition']);

      this.lastPartition = data.partition;
      // console.log(this.lastPartition);

      // current timestep is all processed
      if(this.isTimestepDone()) {
        this.emit("new timestep");
      }
      callback();
    }

    // true means done with processing all the partitions in the timestep
    isTimestepDone(){
      return this.lastPartition === this.MF.workerCount - 1;
    }
}

module.exports = ParameterStream;