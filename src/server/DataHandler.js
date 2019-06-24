const EventEmitter = require('events'),
    Data = require('./Data.js'),
    SortedArray = require('../SortedArray.js'),
    util = require('./Utilities.js');

class DataHandler extends EventEmitter {
    constructor({debug, redundancy}){
        super();

        this.redundancy = redundancy;
        this.debug = debug;

        /**
         * Count of data pieces read from the input stream
         */
        this.readCount = 0;

        /**
         * Count of data pieces totally processed by the workers
         */
        this.processedCount = 0;

        this.allDataHasBeenRead = false;

        /**
         * Buffer for all the data not totally processed and writen 
         * into the stream yet. A Map of order:data
         */
        this.data = new Map();

        /**
         * Buffer for data pieces which are still waiting for processing.
         * A Sorted Array of orders. 
         */
        this.waiting = new SortedArray();

        /**
         * Buffer for data pieces which are totally processed but not 
         * yet written into the stream. A Sorted Array of orders. 
         */
        this.processed = new SortedArray();
    }

    /**
     * Register new data with the Datahandler.
     * @param {any} data 
     */
    addData(data){
        const order = this.readCount;
        this.readCount++;

        this.data.set(order, new Data({
            data,
            order,
            redundancy: this.redundancy
        }));

        this.waiting.add(order)
        this.emit("new-data");
    }

    /**
     * Should be called when the program is finished with reading data.
     */
    endOfData(){
        this.allDataHasBeenRead = true;
    }

    /**
     * Remove the given client's votes from its unprocessed data and 
     * make this data available again.
     * @param {Client} client 
     */
    removeVote(client){
        client.data.forEach((order) => {
            this.data.get(order).removeVoter(client);
        });
        this.emit("new-data");
    }

    /**
     * Should be called when a result si received for a piece of data. Registers the 
     * result with the data object, and handles the steps if data is totally processed. 
     * 
     * @param {Data} data Data object for which the result is to be registered
     * @param {any} result Result can be anything
     */
    handleResult(data, result){
        data.addResult(result);

        util.debug(this.debug, "Received Result");

        // if done with processing this piece, move it to the processed buffer
        if(data.doneWithProcessing()){
            this.processed.add(data.order);
            this.processedCount++;
            this.waiting.remove(data.order);
            this.emit("processed");
        }
    }

    /**
     * Returns all the data (up until the count) this client can vote on.
     * 
     * Adds this client as a voter to all those data pieces and saves the 
     * data pieces to the client.data as well.
     * 
     * If there is no data to send, waits until new data becomes available.
     * 
     * @param {Socket} client See https://socket.io/docs/server-api/#Socket
     * @param {Number} count Upper bound on how many data pieces to send
     * @param {Function} callback Called with (err, data) data being an array 
     *        of Data objects.
     */
    getData(client, count, callback){
        const datas = [];

        // get data the client can vote for, up to the given count
        for(let order of this.waiting.generator()){
            if(datas.length === count){
                break;
            }

            const data = this.data.get(order);

            if(data.canVote(client)){
                client.data.add(order);
                datas.push(data);
                data.addVoter(client);
            }
        }

        // if no data found, wait until new data is registered
        if(!datas.length){
            return this.once("new-data", this.getData.bind(this, client, count, callback));
        }

        return callback(null, datas);
    }

    /**
     * If the data with the given order was processed, removes and returns it
     * from the buffer. If all processing is finished, returns null.
     * 
     * @param {Number} order Order of the data
     * @returns {Data} Processed data or undefined (if that order isn't processed yet). 
     */
    popProcessed(order){
        // no more data left, put null to the stream to close it
        if(this.isProcessingFinished() && !this.data.size){
            return null;
        }

        // the requested data isn't processed yet
        if(!this.processed.has(order)){
            return undefined;
        }

        const data = this.data.get(order);

        // remove this data piece from everywhere
        this.data.delete(order);
        this.processed.remove(order);

        return data;
    }

    /**
     * Processing is finished if all the data has been read from the source,
     * and all the read data is processed succesfully.
     */
    isProcessingFinished(){
        return this.allDataHasBeenRead && this.processedCount === this.readCount;
    }
}

module.exports = DataHandler;