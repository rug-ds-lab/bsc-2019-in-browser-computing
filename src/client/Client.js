'use strict';

const util = require('../Utilities.js');

class Client {
    /**
     * Initialize a client
     * @param {Object} options Consists of the options
     * @param {Boolean} [options.debug=false] Debug mode
     * @param {Number} [options.reconnectInterval=5000] The time (in ms) to wait before trying to reconnect to the server.
     * @param {String} options.workFile
     */
    constructor({socket, debug, reconnectInterval, workFile}) {
        if(!socket) util.error("Socket has to be provided.");
        this.socket = socket;

        if(!workFile) util.error("The work file has to be provided.");
        this.worker = new Worker(workFile);

        this.debug = debug || false; 
        this.reconnectInterval = reconnectInterval || 5000;

        this.socket.on('connect', () => {
            util.debug(this.debug, "Connected to the host");
        });
        
        this.socket.on('initial-data-distributedstream', (data) => {
            util.debug(this.debug, "Received initial data");
            this.worker.postMessage({initialData:data});
        });

        // Run the work function whenever data is received
        this.socket.on('data-distributedstream', (data, callback) => {
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