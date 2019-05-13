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
     * @param {Number} [opt.redundancy=1] Redundancy factor used for the voting algorithm. Defaults to no redundancy
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
            nextOneToSend: null
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
        this.clientManager.on("client-freed", () => {this.emit("Data State Refreshed")});
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
            this.dataSendingRunning = true;
            async.forever(this._sendJob.bind(this));
        }
    }

    /**
     * Called by the stream implementation to indicate this stream should start/resume 
     * producing and pushing data.
     */
    _read(){
        this._startJobs();
    }

    /**
     * Called by the stream implementation when new data is written into this stream.
     */
    _write(data, _encoding, callback){
        this.dataBuffers.raw.push(new Data({
            data,
            order: this.counts.read,
            redundancy: this.redundancy,
            equalityFunction: this.equalityFunction
        }));
        this.counts.read++;
        this.emit("Data State Refreshed");
        callback();
    }

    /**
     * Called by the stream implementation when data writing into this stream is finished.
     * @param {Function} callback 
     */
    _final(callback){
        this.flags.allDataHasBeenRead = true;
        callback();
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

        const dataToSend = this.dataBuffers.raw.filter(data => data.shouldBeSent());

        // no data piece available right now: wait and repeat
        if(!dataToSend.length){
            return this.once("Data State Refreshed", this._sendJob.bind(this, callback));
        }

        async.someSeries(this.clientManager.getFreeClients(), this._canVote.bind(this, dataToSend), (err, canSend) => {
            if(err){
                return callback(err);
            }

            // no client can process any data
            if(!canSend){
                return this.once("Data State Refreshed", this._sendJob.bind(this, callback));
            }

            util.debug(this.debug, "Sending job");

            let client, data;
            ({client, data} = this.dataBuffers.nextOneToSend);
            this.dataBuffers.nextOneToSend = null;

            data.addVoter(client);

            this.clientManager.setClientOccupied(client);
            client.emit("data", [data.data], this._handleResult.bind(this, client, data));
    
            return callback(null);
        });
    }

    /**
     * Returns whether the given client can vote on any of the data items in
     * the dataToSend array.
     * 
     * @param {Array} dataToSend Array of Data items 
     * @param {String} clientId The ID of the client's socket
     * @param {Function} callback Called with (err, true|false)
     */
    _canVote(dataToSend, clientId, callback){
        const client = this.clientManager.clients[clientId];
        const data = dataToSend.find(el => el.canVote(client));

        // if found data, save it for later use
        if(data){
            this.dataBuffers.nextOneToSend = {data, client};
        }

        return callback(null, !!data);
    }

    /**
     * Handler for a new client connecting.
     * 
     * @param {Socket} socket See https://socket.io/docs/server-api/#Socket
     */
    _handleConnection(socket){
        util.debug(this.debug, "A user has connected");
        this.clientManager.addClient.call(this.clientManager, socket);
        socket.data = [];
        socket.on("disconnect", this._handleDisconnect.bind(this, socket));
    }

    /**
     * Handler for a client disconnecting.
     * Makes sure all the data that was being processed by the disconnected
     * client will be handled properly later on.
     * 
     * @param {Socket} client See https://socket.io/docs/server-api/#Socket
     * @param {any} reason Not used here
     */
    _handleDisconnect(client, reason){
        util.debug(this.debug, `A user has disconnected: ${reason}`);
        this.clientManager.removeClient(client);

        util.forEach(client.data, (data) => {
            data.removeVoter(client);
            this.emit("Data State Refreshed");
        });
    }

    /**
     * Handler for a client returning a result. The result is saved and the client is set free.
     * 
     * @param {Socket} client See https://socket.io/docs/server-api/#Socket
     * @param {Data} data
     * @param {Array} result Result processed by the client
     */
    _handleResult(client, data, result){
        util.debug(this.debug, "Received result");

        data.addResult(result);
        delete client.data[data.order];
        this.clientManager.setClientFree(client);

        // if done with processing this piece, move it to the processed buffer
        if(data.doneWithProcessing()){
            this.dataBuffers.raw = this.dataBuffers.raw.filter(el => data !== el);
            this.dataBuffers.processed[data.order] = data;
            this.counts.processed++;
    
            // All data has been sent and also processed back. End of the program.
            if(this.flags.allDataHasBeenRead && this.counts.processed === this.counts.read){
                this.io.close();
                // Push null at the end so that this eventually closes the stream
                this.dataBuffers.processed[this.counts.read] = null;
                this.flags.allDataHasBeenProcessed = true;
                this.emit("Data State Refreshed");
            }

            this._putIntoStream();
        } else if (data.shouldBeSent()){
            this.emit("Data State Refreshed");
        }
    }

    /**
     * If there is processed data that can be written to the stream, writes the majority result
     * to the stream and deletes the data from the buffer.
     *
     * All data should be written to the stream in the order it was read, so a data group
     * can be written only if the data group read one before was written into stream already.
     */
    _putIntoStream(){
        while(this.dataSendingRunning && this.dataBuffers.processed[this.counts.written] !== undefined){
            let res = this.dataBuffers.processed[this.counts.written];
            if(res){
                res = res.getMajorityResult();
            }

            const pushResult = this.push(res);
            delete this.dataBuffers.processed[this.counts.written];
            this.counts.written++;

            // if pushing fails, the stream buffer is full, and we should pause pushing jobs
            // as well as sending data to clients
            if(!pushResult){
                this.dataSendingRunning = false;
            }
        }
    }
}

module.exports = Server;