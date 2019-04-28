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
     *        for processing. If this is an array, each key/index is simply distributed
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
        } else if(typeof opt.data === "function"){
            this.dataType = "function";
        } else {
            throw new Error("Data needs to be an Array or Function.");
        }

        this.data = opt.data;

        /**
         * Keeps track of data sent to a client, but not received back yet
         * TODO: Implement this so that the disconnected clients don't cause data loss
         */
        this.buffer = {};

        /**
         * Count of the fetched data
         */
        this.fetchedCount = 0; 
        this.allDataHasBeenFetched = false;

        /**
         * Count of data groups sent to clients
         */
        this.sentCount = 0;
        this.allDataHasBeenSent = false;

        /**
         * Count of data groups returned by clients
         */
        this.returnedCount = 0;

        /**
         * An intermediary collection of the data returned from the clients
         */
        this.returnedData = {};

        this.clientManager = new ClientManager();
    }

    /**
     * Starts the server with the specified port, which then starts distributing the 
     * jobs between the clients as they connect.
     * 
     * @param {Function} callback Callback to invoke after all the data is processed.
     *                   Invoked with callback(err) with err being null if everything
     *                   went alright.
     */
    startJobs(callback){
        const server = express().listen(this.port);

        util.debug(this.debug, `Server listening on port ${this.port}`);

        this.io = socketio.listen(server);
        this.io.on('connection', this._handleConnection.bind(this));

        this._sendJobs();
        this.callback = callback;
    }

    _collectData(){
        let res = [];

        for(let i=0;i<this.returnedCount;i++){
            this.returnedData[i].forEach((j) => {
                res.push(j);
            });
        }
        
        return res;
    }

    /**
     * Invoke the _sendJobs function in an infinite loop until end of the data.
     */
    _sendJobs(){
        async.forever(this._sendJob.bind(this), (err) => {
            this.io.close();
            this.allDataHasBeenSent = true;
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

        // get a free client and data to be sent
        async.parallel({
            client: this.clientManager.getFreeClient.bind(this.clientManager),
            data: this._fetchData.bind(this, this.jobSize)
        }, (err, results) => {
            if(err){
                return callback(err);
            }

            results.client.emit("data", results.data);
            that.sentCount++;

            results.client.once("result", that._handleResult.bind(that, results.client, that.sentCount));

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

    /**
     * Handler for a client returning a result
     * 
     * @param {Socket} client See https://socket.io/docs/server-api/#Socket
     * @param {Array} result Result returned by the client
     * @param {Number} count
     */
    _handleResult(client, count, result){
        util.debug(this.debug, `Received result: ${result}`);
        this.clientManager.setClientFree(client);
        this.returnedData[count-1] = result;
        this.returnedCount++;

        if(this.allDataHasBeenSent && this.returnedCount === count){
            this.callback(null, this._collectData());
        }
    }

    /**
     * Gives a number of data pieces as specified by the count parameter.
     * @param {Number} count Number of data pieces to return
     * @param {Function} callback Called with (err, data) where data is an array of
     *                   (maximum) size "count". In case the end of the data is reached, or 
     *                   the data function returned an error, the err parameter is truthy. 
     */
    _fetchData(count, callback){
        if(this.allDataHasBeenFetched){
            return callback(new Error("End of Data"));
        }

        switch(this.dataType){
            case "array":
                return this._fetchArrayData(count, callback);
            case "function":
                return this._fetchFunctionData(count, callback);
        }
    }

    /**
     * Refer to _fetchData.
     */
    _fetchArrayData(count, callback){
        const data = this.data.slice(this.fetchedCount, this.fetchedCount + count);

        if(data.length < count){
            this.allDataHasBeenFetched = true;
        }

        this.fetchedCount+=data.length;
        return callback(null, data);
    }

    /**
     * Refer to _fetchData.
     */
    _fetchFunctionData(count, callback){
        const that = this;

        let returnData = [];

        // This wrapping is needed because the async.times calls the iterate function with (number, callback)
        // But this number would be irrelevant for the user provided function.
        const wrappedDataFunction = (_n, callback) => {
            that.data((err, data) => {
                if(err){
                    return callback(err);
                }

                returnData.push(data);
                return callback(null);
            });
        };

        async.times(count, wrappedDataFunction, (err) => {
            if(err){
                that.allDataHasBeenFetched = true;
            }

            that.fetchedCount += returnData.length;
            return callback(null, returnData);
        });
    }
}

module.exports = Server;