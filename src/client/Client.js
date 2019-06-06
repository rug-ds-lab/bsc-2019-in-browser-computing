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
    constructor({host, port, debug, reconnectInterval, workFunction, scripts}) {
        if(!host) util.error("Server address has to be provided.");
        this.host = host;

        // if(!workFunction) util.error("The work function has to be provided.");
        this.workFunction = workFunction;

        this.port = port || 3000;
        this.debug = debug || false; 
        this.reconnectInterval = reconnectInterval || 5000;

        this.workFile = "examples/matrixfactorization/work.js"; //TODO:
        this.worker = new Worker(this.workFile);
        // this.worker = this.createWorker(this.workFile);
        this.connect();
    }

    // /**
    //  * See https://stackoverflow.com/questions/5408406/web-workers-without-a-separate-javascript-file
    //  */
    // createWorker(){
    //     const wrapper = `self.onmessage = function(data){postMessage(data.data.map(${this.workFunction.toString()}))}`;

    //     const blobURL = URL.createObjectURL( new Blob([wrapper], {type:'application/javascript'})),
    //     worker = new Worker(blobURL);

    //     URL.revokeObjectURL(blobURL);
    //     return worker;
    // }

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

            this.worker.postMessage(data);
            this.worker.onmessage = (results) => {
                util.debug(that.debug, `Sent result to the host: ${JSON.stringify(results.data)}`);
                return callback(results.data);
            };
        });
    }
}

module.exports = Client;