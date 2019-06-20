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
         * Counters for data pieces that are:
         *  - read from the input stream,
         *  - processed by the workers
         *  - written to the output stream
         */
        this.counts = {
            read: 0,
            processed: 0
        }

        this.allDataHasBeenRead = false;

        /**
         * Buffers for data pieces that:
         *  - isn't done with processing yet (but it might be being processed by enough workers atm)
         *  - are totally processed, but not written to the stream yet. The key is the read order.
         * 
         *  Also stores the data/client pair that should be sent the next
         *  in an object that is {client, data}.
         */
        this.data = new Map();
        this.waiting = new SortedArray();
        this.processed = new SortedArray();
    }

    /**
     * Register new data with the Datahandler.
     * @param {any} data 
     */
    addData(data){
        const order = this.counts.read;
        this.counts.read++;

        this.data.set(order, new Data({
            data,
            order,
            redundancy: this.redundancy
        }));

        this.waiting.add(order)
        this.emit("new-data");
    }

    endOfData(){
        this.allDataHasBeenRead = true;
    }

    // remove the given client's votes and put its data to appropriate buffers
    removeVote(client){
        client.data.forEach((order) => {
            this.data.get(order).removeVoter(client);
        });
        this.emit("new-data");
    }

    handleResult(data, result){
        data.addResult(result);

        util.debug(this.debug, "Received Result");

        // if done with processing this piece, move it to the processed buffer
        if(data.doneWithProcessing()){
            this.processed.add(data.order);
            this.counts.processed++;
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

    isProcessingFinished(){
        return this.allDataHasBeenRead && this.counts.processed === this.counts.read;
    }
}

module.exports = DataHandler;