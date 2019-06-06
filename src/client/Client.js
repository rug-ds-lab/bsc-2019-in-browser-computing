'use strict';

const util = require('../Utilities.js');

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
    constructor({debug, reconnectInterval, workFunction, socket}) {
        if(!socket) util.error("Socket has to be provided");
        this.socket = socket;

        this.workFunction = workFunction;

        // this.port = port || 3000;
        this.debug = debug || false; 
        this.reconnectInterval = reconnectInterval || 5000;

        this.workFile = "examples/matrixfactorization/work.js"; //TODO:
        this.worker = new Worker(this.workFile);

        this.connect();
    }

    /**
     * Connect to the predefined host and port;
     */
    connect() {
        this.socket.on('connect', () => {
            util.debug(this.debug, "Connected to the host");
        });

        // Run the work function whenever data is received
        this.socket.on('data', (data, callback) => {
            util.debug(this.debug, `Received data from the host: ${JSON.stringify(data)}`);

            this.worker.postMessage(data);
            this.worker.onmessage = (results) => {
                util.debug(this.debug, `Sent result to the host: ${JSON.stringify(results.data)}`);
                return callback(results.data);
            };
        });
    }
}

module.exports = Client;