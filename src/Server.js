'use strict';

const express = require('express'),
    socketio = require('socket.io'),
    util = require('./util.js'),
    ClientManager = require('./ClientManager.js'),
    async = require('async'),
    stream = require('stream'),
    Data = require('./Data.js');

class Server extends stream.Duplex {

    /**
     * Initialize the Server
     * @param {Object} [opt={}] Options
     * @param {Number} [opt.port=3000] The Server port.
     * @param {Boolean} [opt.debug=false] Debug mode
     * @param {Number} [opt.jobSize=20] Pieces of data to send in each individual batch of job to the clients
     * @param {Number} [opt.highWaterMark=100] Maximum number of data batches to put into the stream at once
     * @param {Number} [opt.redundancy=1] TODO: explain
     * @param {Function} [opt.equalityFunction]
     */
    constructor({debug, port, jobSize, highWaterMark, redundancy, equalityFunction}={}) {
        super({objectMode: true, highWaterMark: highWaterMark || 100});

        this.debug = debug || false; 
        this.port = port || 3000;
        this.jobSize = jobSize || 20;
        this.redundancy = redundancy || 1;
        this.equalityFunction = equalityFunction || ((obj1, obj2) => JSON.stringify(obj1) === JSON.stringify(obj2));

        /**
         * Buffers for data pieces that are:
         *  - read and possibly sent to a client, but not processed yet.
         *  - processed by a worker, but not written to the stream yet. 
         *    The keys are the order data was initially read.
         */
        this.dataBuffers = {
            raw: [],
            processed: {},
            process: {} // to keep track of which process is doing what
        }

        /**
         * Counters for data pieces that are:
         *  - read from the input stream,
         *  - processed by the workers
         *  - written to the output stream
         */
        this.counts = {
            read: 0,
            processed: 0,
            written: 0
        }

        this.flags = {
            allDataHasBeenRead: false,
            allDataHasBeenProcessed: false,
            dataSendingRunning: false
        }

        this.clientManager = new ClientManager();
        this.clientManager.on("client-freed", () => {this.emit("fetch")});
        this.io = null; //socket io
    }

    /**
     * Starts the server with the specified port, which then starts distributing the 
     * jobs between the clients as they connect.
     * 
     * It's idempotent: If the server is already sending jobs, calling this function
     * should not do anything.
     */
    _startJobs(){
        if(!this.io){
            const server = express().listen(this.port);

            util.debug(this.debug, `Server listening on port ${this.port}`);
    
            this.io = socketio.listen(server);
            this.io.on('connection', this._handleConnection.bind(this));
        }

        if(!this.dataSendingRunning && !this.flags.allDataHasBeenProcessed){
            this._sendJobs();
        }
    }

    _read(){
        this._startJobs();
    }

    _write(data, _encoding, callback){
        this.dataBuffers.raw.push(new Data(data, this.counts.read));
        this.counts.read++;
        this.emit("fetch");
        callback();
    }

    _final(callback){
        this.flags.allDataHasBeenRead = true;
        callback();
    }

    /**
     * Invoke the _sendJob function in an infinite loop.
     */
    _sendJobs(){
        this.dataSendingRunning = true;

        async.forever(this._sendJob.bind(this));
    }

    /**
     * Fetches data from the data source and a free client, sends that data to that client.
     * When the data processing is done, _handleResult is invoked with the results.
     * 
     * @param {Function} callback Invoked after the data is sent (but independently of whether
     *                            the result is actually collected) or after an error. 
     */
    _sendJob(callback){
        if(this.flags.allDataHasBeenProcessed){
            return callback(new Error("End of Data"));
        }

        if(!this.dataSendingRunning){
            return callback(new Error("Paused"));
        }

        const dataToSend = this._getDataToSend();

        // no data piece available right now: wait and repeat
        if(!dataToSend.length){
            return this.once("fetch", this._sendJob.bind(this, callback));
        }

        async.detectSeries(this.clientManager.freeClients, this._fetchData.bind(this, dataToSend), (err, clientId) => {
            if(err){
                return callback(err);
            }

            // no client can process any data
            if(clientId === undefined){
                return this.once("fetch", this._sendJob.bind(this, callback));
            }

            util.debug(this.debug, "Sending job");

            // increase the currentProcessorCount of the data and send it
            const data = this.dataBuffers.process[clientId];
            const client = this.clientManager.clients[clientId];

            data.currentProcessorCount++;

            this.clientManager.setClientOccupied(client);
            client.emit("data", [data.data], this._handleResult.bind(this, client, data));
    
            return callback(null);
        });
    }

    //TODO: rewrite docs
    _fetchData(dataToSend, clientId, callback){
        const client = this.clientManager.clients[clientId];

        // if there is data, check if this client can process any
        const data = dataToSend.find(el => !el.processedByClient(client));

        if(!data){
            return callback(null, false);
        }

        this.dataBuffers.process[client.id] = data;
        return callback(null, true);
    }

    /**
     * Handler for a new client connecting.
     * 
     * @param {Socket} socket See https://socket.io/docs/server-api/#Socket
     */
    _handleConnection(socket){
        util.debug(this.debug, "A user has connected");
        this.clientManager.addClient.call(this.clientManager, socket);

        socket.on("disconnect", this._handleDisconnect.bind(this, socket));
    }

    /**
     * Handler for a client disconnecting
     * 
     * @param {Socket} client See https://socket.io/docs/server-api/#Socket
     * @param {any} reason Not used here
     */
    _handleDisconnect(client, reason){
        util.debug(this.debug, `A user has disconnected: ${reason}`);
        this.clientManager.removeClient(client);

        if(this.dataBuffers.process[client.id]){
            if(this.dataBuffers.process[client.id].shouldBeSent()){
                this.emit("freed");
            }
            this.dataBuffers.process[client.id].currentProcessorCount--;
            delete this.dataBuffers.process[client.id];
        }
    }

    /**
     * Handler for a client returning a result.
     * Increases the processed, puts the processed result into the dataBuffers.processed object
     * with the order as the key, deletes the data from the buffer.
     * 
     * If all the data has been sent, processed and processed back with the calling of this
     * function, it invokes the callback to let the user know their data is ready.
     * 
     * @param {Socket} client See https://socket.io/docs/server-api/#Socket
     * @param {Data} data
     * @param {Array} result Result processed by the client
     */
    _handleResult(client, data, result){
        util.debug(this.debug, "Received result");

        data.addResult(result, client, this.equalityFunction);

        // the client processed its data so the record can be deleted
        delete this.dataBuffers.process[client.id];

        this.clientManager.setClientFree(client);

        data.currentProcessorCount--;

        // if done with processing this piece, move it to the processed buffer
        if(data.doneWithProcessing(this.redundancy)){
            this.dataBuffers.raw = this.dataBuffers.raw.filter(el => data !== el);
            this.dataBuffers.processed[data.order] = data;
            this.counts.processed++;
    
            // All data has been sent and also processed back. End of the program.
            if(this.flags.allDataHasBeenRead && this.counts.processed === this.counts.read){
                this.io.close();
                // Push null at the end so that this eventually closes the stream
                this.dataBuffers.processed[this.counts.read] = null;
                this.flags.allDataHasBeenProcessed = true;
                this.emit("fetch");
            }

            this._putIntoStream();
        } else if (data.shouldBeSent(this.redundancy)){
            this.emit("fetch");
        }
    }

    /**
     * If there is processed data that can be written to the stream, writes it to the stream
     * and deletes it from the buffer.
     *
     * All data should be written to the stream in the order it was read, so a data group
     * can be written only if the data group read one before was written into stream already.
     * Track of this is kept via count.written.
     */
    _putIntoStream(){
        while(this.dataSendingRunning && this.dataBuffers.processed[this.counts.written] !== undefined){
            const pushResult = this.push(this.dataBuffers.processed[this.counts.written]);
            delete this.dataBuffers.processed[this.counts.written];
            this.counts.written++;

            // if pushing fails, the stream buffer is full, and we should pause pushing jobs
            // as well as sending data to clients
            if(!pushResult){
                this.dataSendingRunning = false;
            }
        }
    }

    _getDataToSend(){
        return this.dataBuffers.raw.filter(el => el.shouldBeSent(this.redundancy));
    }
}

module.exports = Server;