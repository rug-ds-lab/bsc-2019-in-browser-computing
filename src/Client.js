'use strict';

const io = require('socket.io-client'),
    util = require('./util.js');

class Client {

    /**
     * Initialize a client
     * @param {Object} opt Consists of the options
     * @param {String} opt.host Server address. 
     * @param {Number} [opt.port=80] The port of the server machine.
     * @param {Boolean} [opt.debug=false] Debug mode
     * @param {Number} [opt.reconnectInterval=5000] The time (in ms) to wait before trying to reconnect to the server.
     * @param {Function} opt.workFunction The function the client will perform. Called with (data, callback).
     *                   Expected to call the callback as callback(result) when it's done evaluating the data.
     */
    constructor(opt) {
        if(!opt.host){
            throw new Error("Server address has to be provided.");
        }
        this.host = opt.host;

        if(!opt.workFunction){
            throw new Error("The work function has to be provided.");
        }
        this.workFunction = opt.workFunction;

        this.port = opt.port || 80;
        this.debug = opt.debug || false; 
        this.reconnectInterval = opt.reconnectInterval || 5000;
    }

    /**
     * Connect to the predefined host and port
     */
    connect() {
        const that = this;

        const socket = io.connect("http://localhost:3000");

        socket.on('connect', function(){
            util.debug(that.debug, "Connected to the host");
        });

        socket.on('data', (data) => {
            util.debug(that.debug, `Received data from the host: ${data}`);
            that.workFunction(data, (result) => {
                socket.emit('result', result);
                console.log(`Send result to the host: ${result}`);
            });
        });
    }
}

module.exports = Client;