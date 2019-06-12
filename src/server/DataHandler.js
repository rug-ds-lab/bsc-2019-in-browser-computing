const EventEmitter = require('events'),
    Data = require('./Data.js');

class DataHandler extends EventEmitter {
    constructor({equalityFunction, redundancy}){
        super();

        this.equalityFunction = equalityFunction;
        this.redundancy = redundancy;

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
         *  - can be sent to a suitable worker right away.
         *  - are currently being processed by enough workers.
         *  - are totally processed, but not written to the stream yet. The key is the read order.
         * 
         *  Also stores the data/client pair that should be sent the next
         *  in an object that is {client, data}.
         */
        this.data = new Map();
        this.canBeSent = [];
        this.processed = []; // TODO: Keep sorted!!!
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
            order, //TODO: Is necessary?
            redundancy: this.redundancy,
            equalityFunction: this.equalityFunction
        }));

        this.canBeSent.push(order)
        this.emit("new-data");
    }

    endOfData(){
        this.allDataHasBeenRead = true;
    }

    // remove the given client's votes and put its data to appropriate buffers
    removeVote(client){
        client.data.forEach((order) => {
            this.data.get(order).removeVoter(client);
            if(this.canBeSent.indexOf(order) === -1){ // TODO: Better way?
                this.canBeSent.unshift(order);
            }
        });
    }

    handleResult(data, result){
        data.addResult(result);

        // if done with processing this piece, move it to the processed buffer
        if(data.doneWithProcessing()){
            this.processed.push(data.order);
            this.counts.processed++;
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
        for(let i=0; i<this.canBeSent.length && datas.length < count; i++){
            const order = this.canBeSent[i];

            if(this.data.get(order).canVote(client)){
                client.data.add(order);

                const data = this.data.get(order);

                datas.push(data);
                data.addVoter(client);
                // if we don't need to send this anymore, do book keeping
                if(!data.shouldBeSent()){
                    this.canBeSent.splice(i,1);
                    i--;
                }
            }
        }

        // if no data found, wait until new data is registered
        if(!datas.length){
            return this.once("new-data", this.getData.bind(this, client, count, callback));
        }

        return callback(null, datas);
    }

    popProcessed(order){
        //TODO: Make this efficient by adding sorted arrays
        let index;

        // no more data left, put null to the stream to close it
        if(this.isProcessingFinished() && !this.data.size){
            return null;
        }

        if((index = this.processed.indexOf(order)) === -1){
            return undefined;
        }

        const data = this.data.get(order);

        // remove this data piece from everywhere
        this.data.delete(order);
        this.processed.splice(index, 1);

        return data;
    }

    isProcessingFinished(){
        return this.allDataHasBeenRead && this.counts.processed === this.counts.read;
    }
}

module.exports = DataHandler;