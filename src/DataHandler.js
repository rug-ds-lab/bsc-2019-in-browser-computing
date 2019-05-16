class DataHandler{
    constructor(){

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

        this.allDataHasBeenRead: false;

        /**
         * Buffers for data pieces that:
         *  - can be sent to a suitable worker right away.
         *  - are currently being processed by enough workers.
         *  - are totally processed, but not written to the stream yet. The key is the read order.
         * 
         *  Also stores the data/client pair that should be sent the next
         *  in an object that is {client, data}.
         */
        this.dataBuffers = {
            canBeSent: new Set(),
            beingProcessed: new Set(),
            processed: new Map(),
        }
    }

    addData(data){
        this.dataBuffers.canBeSent.add(data);
        this.counts.read++;
        this.emit("new-data");
    }

    allDataHasBeenRead(){
        // Put null at the end so that this eventually closes the stream
        this.dataBuffers.processed.set(this.counts.read, null);
    }

    // remove the given client's votes and put its data to appropriate buffers
    removeVote(client){
        client.data.forEach((data) => {
            data.removeVoter(client);
            this.dataBuffers.beingProcessed.delete(data); 
            this.dataBuffers.canBeSent.add(data);
        });
    }

    handleResult(client, data, result){
        data.addResult(result);

        // if done with processing this piece, move it to the processed buffer
        if(data.doneWithProcessing()){
            this.dataBuffers.beingProcessed.delete(data);
            this.dataBuffers.processed.set(data.order, data);
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
     *        of raw data pieces *NOT* Data objects.
     */
    getData(client, count, callback){
        const datas = Array.from(this.dataBuffers.canBeSent.values()).filter((data) => data.canVote(client));

        if(datas.length){
            datas.forEach((data) => {
                data.addVoter(client);
                client.data.add(data);
                // if we don't need to send this anymore, do book keeping
                if(!data.shouldBeSent()){
                    this.dataBuffers.canBeSent.delete(data);
                    this.dataBuffers.beingProcessed.add(data);
                }
            });

            return callback(null, datas.slice(0, count));
        }

        this.once("new-data", this.getData.bind(this, client, count, callback));
    }

    popProcessed(key){
        const data = this.dataBuffers.processed.get(key);
        this.dataBuffers.processed.delete(key);
        return data;
    }

    isProcessingFinished(){
        return this.allDataHasBeenRead && this.counts.processed === this.counts.read;
    }
}

module.exports = DataHandler;