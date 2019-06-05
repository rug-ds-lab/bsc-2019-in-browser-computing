'use strict';

const io = require('socket.io-client'),
      util = require('../Utilities.js');

class Client {
    /**
     * Initialize a client
     * @param {Object} options Consists of the options
     * @param {String} options.host Server address.
     * @param {Number} [options.port=3000] The port of the server machine.
     * @param {Boolean} [options.debug=false] Debug mode
     * @param {Number} [options.reconnectInterval=5000] The time (in ms) to wait before trying to reconnect to the server.
     * @param {Function} options.workFunction The function the client will perform. Called with (data, callback).
     *                   Expected to call the callback as callback(result) when it's done evaluating the data.
     */
    constructor({ host, port, debug, reconnectInterval, workFunction }) {
        if(!host) util.error("Server address has to be provided.");
        this.host = host;

        if(!workFunction) util.error("The work function has to be provided.");
        this.workFunction = workFunction;

        this.port = port || 3000;
        this.debug = debug || false; 
        this.reconnectInterval = reconnectInterval || 5000;
    }

    /**
     * Connect to the predefined host and port;
     */
    connect() {
        const that = this;
        const socket = io.connect(`${this.host}:${this.port}`);

        socket.on('connect', () => {
            util.debug(that.debug, "Connected to the host");
        });

        // Run the work function whenever data is received
        socket.on('data', (data, callback) => {
            util.debug(that.debug, `Received data from the host: ${JSON.stringify(data)}`);
            that.workFunction(data).then((response) => {
                util.debug(that.debug, `Sent result to the host: ${JSON.stringify(response)}`);

                return callback(response);
            });
        });
    }
}

module.exports = Client;
