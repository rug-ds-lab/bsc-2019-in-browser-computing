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
      // console.log(data);
      this.MF.W.updateSubset(data.W_partition, data.W_partition.begin_m, data.W_partition.end_m, 0, this.MF.featureCount);
      this.MF.H.updateSubset(data.H_partition, data.H_partition.begin_m, data.H_partition.end_m, 0, this.MF.featureCount);

      this.lastPartition = data.partition;

      // console.log("Received: ", chunk);
      // current timestep is all processed
      if(this.lastPartition === this.MF.workerCount - 1) {
        this.emit("new timestep");
      }
      callback();
    }
}

module.exports = ParameterStream;