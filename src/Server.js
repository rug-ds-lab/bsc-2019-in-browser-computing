'use strict';

const express = require('express'),
    socketio = require('socket.io'),
    util = require('./util.js'),
    ClientManager = require('./ClientManager.js'),
    async = require('async');
 
class Server {

    /**
     * Initialize the Server
     * @param {Object} opt Options
     * @param {Number} [opt.port=80] The Server port.
     * @param {Boolean} [opt.debug=false] Debug mode
     * @param {Object|Array|Function} opt.data The data that is to be sent to the clients
     *        for processing. If this is an array or an object, each key/index is simply distributed
     *        amongst the clients. If a function is passed, the function is called continously 
     *        with f(callback). The function should return more (and distinct) data at each calling
     *        by evoking callback(err, data). If a truity err is passed, it's interpreted as the end
     *        of the data stream.
     * @param {Number} [opt.jobSize=20] Pieces of data to send in each individual batch of job to the clients
     * @param {Number} [opt.reconnectInterval=5000] The time (in ms) to wait before trying to reconnect to a client.
     */
    constructor(opt) {
        this.debug = opt.debug || false; 
        this.port = opt.port || 80;
        this.reconnectInterval = opt.reconnectInterval || 5000;
        this.jobSize = opt.jobSize || 20;

        if(!opt.data){
            throw new Error("Data Option is mandatory.");
        } else if(Array.isArray(opt.data)){
            this.dataType = "array";
        } else if(typeof opt.data === "object"){
            this.dataType = "object";
        } else if(typeof opt.data === "function"){
            this.dataType = "function";
        } else {
            throw new Error("Data needs to be an Array, Object or Function.");
        }

        this.data = opt.data;

        /**
         * Keeps track of data sent to a client, but not received back yet
         * TODO: Implement this so that the disconnected clients don't cause data loss
         */
        this.buffer = {};

        /**
         * Keeps count of the data already fetched and sent to users
         */
        this.fetchedCount = 0; 

        this.clientManager = new ClientManager();
    }

    /**
     * Start the server with the specified port.
     */
    startServer(){
        const server = express().listen(this.port);

        util.debug(this.debug, `Server listening on port ${this.port}`);

        const io = socketio.listen(server);
        io.on('connection', this._handleConnection.bind(this));

        this._sendJobs();
    }

    _sendJobs(){
        async.forever(this._sendJob.bind(this), (err) => {
            // TODO: Somehow hand the control back to the user program here 
            console.log(err);
        });
    }

    _sendJob(callback){
        const that = this;

        // get a free client and data to be sent
        async.parallel({
            client: this.clientManager.getFreeClient.bind(this.clientManager),
            data: this._getData.bind(this, this.jobSize)
        }, (err, results) => {
            if(err){
                return callback(err);
            }

            results.client.emit("data", results.data);
            that.fetchedCount+=results.data.length;

            results.client.once("result", that._handleResult.bind(that, results.client));
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
    }

    _handleResult(client, result){
        // TODO: Actually do something with the processed data 
        util.debug(this.debug, `Received result: ${result}`);
        this.clientManager.setClientFree(client);
    }

    /**
     * Gives a number of data pieces as specified by the count parameter.
     * @param {Number} count Number of data pieces to return
     * @param {Function} callback Called with (err, data) where data is an array of
     *                   (maximum) size "count". In case the end of the data is reached, or 
     *                   the data function returned an error, the err parameter is truthy. 
     */
    _getData(count, callback){
        switch(this.dataType){
            case "array":
                return this._getArrayData(count, callback);
            case "object":
                return this._getObjectData(count, callback);
            case "function":
                return this._getFunctionData(count, callback);
        }
    }

    /**
     * Refer to _getData.
     */
    _getArrayData(count, callback){
        const data = this.data.slice(this.fetchedCount, this.fetchedCount + count);
        if(!data.length){
            return callback(new Error("No more data"));
        }
        return callback(null, data);
    }

    /**
     * Refer to _getData.
     */
    _getObjectData(count, callback){
        const keys = Object.keys(this.data).slice(this.fetchedCount, this.fetchedCount + count);

        // no more data left
        if(!keys.length){
            return callback(new Error("No more data"));
        }

        let data = [];
        keys.forEach((key) => {
            data.push(this.data[key]);
        });
        return callback(null, data);
    }

    /**
     * Refer to _getData.
     */
    _getFunctionData(count, callback){
        
    }
}

module.exports = Server;