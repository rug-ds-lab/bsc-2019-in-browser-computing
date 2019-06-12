const Utils = require('./Utils.js');

class Partitioner {

    static partitionDataMatrixFactorization(data, userCount, movieCount, workerCount) {
        let dataPartitions = {};

        let chunksUsers = Utils.chunkBeginEnd(userCount, workerCount);
        let chunksMovies = Utils.chunkBeginEnd(movieCount, workerCount);

        data.data.forEach((value, key) => {
            let idx = key.split(',').map(Number);

            let user = idx[0];
            let movie = idx[1];

            let userPartition = -1;
            let moviePartition = -1;

            for(let idx = 0; idx < workerCount; idx++) {
                if(user >= chunksUsers[idx][0] && user <= chunksUsers[idx][1]) {
                    userPartition = idx;
                    break;
                }
            }
            for(let idx = 0; idx < workerCount; idx++) {
                if(movie >= chunksMovies[idx][0] && movie <= chunksMovies[idx][1]) {
                    moviePartition = idx;
                    break;
                }
            }
            let nKey = [userPartition, moviePartition].toString();
            if(!(nKey in dataPartitions)) {
                dataPartitions[nKey] = new Map();
            }
            dataPartitions[nKey].set(key, value);

        });
        return dataPartitions;
    }

    static partitionParamsMatrixFactorization(data, W, H, workerCount, timestep) {
        let userCount = W.m;
        let movieCount = H.m;
        let featureCount = W.n;

        let chunksUsers = Utils.chunkBeginEnd(userCount, workerCount);
        let chunksMovies = Utils.chunkBeginEnd(movieCount, workerCount);

        let partitions = [];

        for(let W_idx = 0; W_idx < workerCount; W_idx++) {
            let part = {};

            let H_idx = (W_idx + timestep) % workerCount;

            part.W_partition = W.getRows(chunksUsers[W_idx][0], chunksUsers[W_idx][1]);
            part.H_partition = H.getRows(chunksMovies[H_idx][0], chunksMovies[H_idx][1]);

            partitions.push(part);
        }
        return partitions;
    }
}

module.exports = Partitioner;