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

      // current timestep is all processed
      if(this.lastPartition === this.MF.workerCount - 1) {
        this.emit("new timestep");
      }
      callback();
    }
}

module.exports = ParameterStream;