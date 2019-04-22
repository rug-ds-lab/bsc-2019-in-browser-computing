'use strict';

const net = require('net');
const {workFunction, settings} = require('./Setup');

class Client {

    constructor() {
        this.client = new net.Socket();
        this.state = {
            interval: null,
        }
        /**
         * Action responder uppon a connection event.
         * Will only get triggered after a succesfull
         * invokation of the connect function;
         */
        this.client.on('connect', () => {
            if (this.state.interval !== null) {
                clearInterval(this.state.interval);
                this.state.interval = null;
            }
        });

        /**
         * Action responder uppon being invoked
         * from the server;
         */
        this.client.on('data', (response) => {
            const jsonResponse = JSON.parse(response);
            const { id, load } = jsonResponse;
            if (settings.debug) console.log(`${id} :: Received Load - ${load}`);
            const data = workFunction(jsonResponse);
            const jsonData = JSON.stringify({
                id,
                load,
                data,
            });
            this.client.write(jsonData);
        });

        /**
         * Action responder when an error is being thrown;
         */
        this.client.on('error', () => {
            this.tryToConnect();
        });

        this.connect();
    }

    /**
     * Connect to predefined host and port;
     */
    connect() {
        this.client.connect({ 
            port: settings.port,
        });
    }

    /**
     * Set an interval that continuously tries
     * to connect to the origin server;
     */
    tryToConnect() {
        if (settings.debug) console.log(this.state.interval === null ? "Setting Interval" : "Interval Set");
        if (this.state.interval === null) {
            this.state.interval = setInterval(() => this.connect(), 5000);
        }
    }
}

new Client();
