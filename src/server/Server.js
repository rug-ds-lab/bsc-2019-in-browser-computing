'use strict';

const express = require('express'),
    socketio = require('socket.io'),
    util = require('../Utilities.js'),
    ClientManager = require('./ClientManager.js'),
    async = require('async'),
    stream = require('stream'),
    EventEmitter = require('events');

class Server extends stream.Duplex {

    /**
     * Initialize the Server
     * @param {Object} [opt={}] Options
     * @param {Number} [opt.port=3000] The Server port.
     * @param {Boolean} [opt.debug=false] Debug mode
     * @param {Number} [opt.jobSize=20] Pieces of data to send in each individual batch of job to the clients
     * @param {Number} [opt.highWaterMark=100] Maximum number of data batches to put into the stream at once
     */
    constructor({debug, port, jobSize, highWaterMark}={}) {
        super({objectMode: true, highWaterMark: highWaterMark || 100});

        this.debug = debug || false; 
        this.port = port || 3000;
        this.jobSize = jobSize || 20;

        /**
         * Buffers for data pieces that are:
         *  - read and possibly sent to a client, but not processed yet. 
         *    The keys are either the worker's socket id, or "unclaimed"
         *  - processed by a worker, but not written to the stream yet. 
         *    The keys are the order data was initially read.
         */
        this.dataBuffers = {
            raw: {unclaimed:[]},
            processed: {}
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
            allDataHasBeenSent: false,
            dataSendingRunning: false
        }

        this.clientManager = new ClientManager();
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

        if(!this.dataSendingRunning){
            this._sendJobs();
        }
    }

    _read(){
        this._startJobs();
    }

    _write(chunk, _encoding, callback){
        this.dataBuffers.raw.unclaimed.push({order: this.counts.read, data:chunk});
        this.counts.read++;
        this.emit("new data");
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

        async.forever(this._sendJob.bind(this), (err) => {
            if(err.message === "End of Data"){
                this.flags.allDataHasBeenSent = true;
            }
        });
    }

    /**
     * Fetches data from the data source and a free client, sends that data to that client.
     * When the data processing is done, _handleResult is invoked with the results.
     * 
     * @param {Function} callback Invoked after the data is sent (but independently of whether
     *                            the result is actually collected) or after an error. 
     */
    _sendJob(callback){
        const that = this;

        if(!this.dataSendingRunning){
            return callback(new Error("Paused"));
        }

        // get a free client and data to be sent
        async.parallel({
            client: this.clientManager.getFreeClient.bind(this.clientManager),
            data: this._fetchData.bind(this)
        }, (err, results) => {
            if(err){
                return callback(err);
            }

            util.debug(that.debug, "Sending job");

            // add the data to the sent buffer, then actually send it
            that.dataBuffers.raw[results.client.id] = results.data;
            results.client.emit("data", [results.data.data], that._handleResult.bind(that, results.client, results.data.order));

            return callback(null);
        });
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
     * Handler for a client disconnecting. Delegates any data this client might have
     * in the buffer to "unclaimed"
     * 
     * @param {Socket} client See https://socket.io/docs/server-api/#Socket
     * @param {any} reason Not used here
     */
    _handleDisconnect(client, reason){
        util.debug(this.debug, `A user has disconnected: ${reason}`);
        this.clientManager.removeClient(client);

        if(this.dataBuffers.raw[client.id]){
            this.dataBuffers.raw.unclaimed.push(this.dataBuffers.raw[client.id]);
            delete this.dataBuffers.raw[client.id];
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
     * @param {Number} order The order this data was read from the data source initially 
     * @param {Array} result Result processed by the client
     */
    _handleResult(client, order, result){
        util.debug(this.debug, "Received result");

        this.dataBuffers.processed[order] = result;
        this.counts.processed++;

        // the client processed its data so the record can be deleted
        delete this.dataBuffers.raw[client.id];

        this.clientManager.setClientFree(client);

        // All data has been sent and also processed back. End of the program.
        if(this.flags.allDataHasBeenSent && this.counts.processed === this.counts.read){
            this.io.close();
            // Push null at the end so that this eventually closes the stream
            this.dataBuffers.processed[this.counts.read] = null;
        }

        this._putIntoStream();
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

    /**
     * Returns a data piece, or throws an error if all the data has been read.
     * 
     * @param {Function} callback Called with (err, data)
     */
    _fetchData(callback){
        if(this.dataBuffers.raw.unclaimed.length){
            return callback(null, this.dataBuffers.raw.unclaimed.shift());
        }

        // if the buffer has no data left and this flag has been set, no more data left to fetch
        if(this.flags.allDataHasBeenRead){
            return callback(new Error("End of Data"));
        }

        // wait for the "new data" event to be emitted
        const that = this;
        this.once("new data", () => {
            return that._fetchData(callback);
        });
    }
}

module.exports = Server;
