const Utils = require('./Utils.js');

class Partitioner {

    static partitionDummy(iteration_space, dvecs, worker_count, user_count, movie_count, feature_count) {
        // Dependence vector(0,∞) means that any iteration(p′1,p′2) depends on iteration (p1,p2) as long as p′1−p1==0.

        let data = iteration_space[0];
        let W = iteration_space[1];
        let H = iteration_space[2];

        // console.log(W.data.length);

        // console.log(data);
        let chunksUsers = Utils.chunkBeginEnd(user_count, worker_count);
        let chunksMovies = Utils.chunkBeginEnd(movie_count, worker_count);

        let partitions = [];
        // Necessary to do this in <worker_count> amount of time steps.
        for(let timestep = 0; timestep < worker_count; timestep++) {

            let partition = {};
            partition['timestep'] = timestep;
            partition['parts'] = [];
            for(let idx = 0; idx < worker_count; idx++) {
                let partition_part = {};

                let i = (idx + timestep) % worker_count;

                let data_partition = data.getSubset([chunksUsers[i], chunksMovies[idx]]);
                let W_partition = W.getRows(chunksUsers[i][0], chunksUsers[i][1]);
                let H_partition = H.getRows(chunksMovies[idx][0], chunksMovies[idx][1]);

                partition_part['data_partition'] = data_partition;
                partition_part['W_partition'] = W_partition;
                partition_part['H_partition'] = H_partition;
                partition['parts'].push(partition_part);
            }
            partitions.push(partition);
        }


        return partitions;
    }
}

module.exports = Partitioner;