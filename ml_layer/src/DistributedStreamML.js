import DistributedStream from 'distributed-stream/src/DistributedStream';
import es from 'event-stream';
import EventEmitter from 'events';
import ParameterMatrix from './ParameterMatrix';

class DistributedStreamML {
   /**
     * Initialize a client
     * @param {Object} socket Websocket object.
     * @param {Function} partition Partition function used to partition the parameter partitions
     * @param {Object} initialData Initial data which should be send to all of the worker clients
     * @param {Array} parameters Parameter Matrices which contain the parameters of the model.
     * @param {Object} hyperparameters The hyperparameters which should be send to all of the worker clients
     */
    constructor({socket, partition, guard, initialData, parameters, hyperparameters}) {

        const distributedStream = new DistributedStream({socket, initialData});
        const e = new EventEmitter();
        this.e = e;

        /** Function which is resolved when a "new timestep" event is emitted.
         * This means the next jobs can be pushed to the DistributedStream.
         */
        const f = function(totalTimesteps, callback) {
            return e.once("new timestep", startNewIteration.bind(this, totalTimesteps, callback));
        }

        /**
         * This function calls the partition function and sends out new jobs to the DistributedStream.
         */
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

        /**
         * updates the parameter matrices with results, triggers a "new timestep" event
         * when it is done.
         */
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
    }

    /**
     * Start function which starts the process of training the model. The timeout
     * is necessary in order to set up all eventlisteners.
     */
    start() {
        setTimeout(() => this.e.emit("new timestep"), 100);
    }
}

export default DistributedStreamML;