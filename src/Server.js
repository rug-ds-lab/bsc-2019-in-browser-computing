'use strict';

const express = require('express'),
    socketio = require('socket.io'),
    util = require('./util.js');
 
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
     * @param {Number} [opt.reconnectInterval=5000] The time (in ms) to wait before trying to reconnect to a client.
     */
    constructor(opt) {
        this.debug = opt.debug || false; 
        this.port = opt.port || 80;
        this.reconnectInterval = opt.reconnectInterval || 5000;

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
    }

    /**
     * Start the server with the specified port.
     */
    startServer(){
        const server = express().listen(this.port);

        util.debug(this.debug, `Server listening on port ${this.port}`);

        const io = socketio.listen(server);
        io.on('connection', this._handleConnection.bind(this));
    }

    //TODO: EVERYTHING BELOW STILL NEEDS REAL IMPLEMENTATIONS

    /**
     * 
     * @param {Socket} socket See https://socket.io/docs/server-api/#Socket
     */
    _handleConnection(socket){
        util.debug(this.debug, "A user has connected");
        this._getData(1, (err, data) => {
            socket.emit('data', data);
        });
        socket.on('result', this._handleResult.bind(this));
    }

    _handleResult(result){
        util.debug(this.debug, `Received result: ${result}`);
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

    // TODO: Actually implement these functions
    _getArrayData(count, callback){
        return callback(null, this.data[0]);
    }

    _getObjectData(count, callback){

    }

    _getFunctionData(count, callback){

    }
}

module.exports = Server;