'use strict';

const net = require('net');
const {workFunction, settings} = require('./Setup');

const client = new net.Socket();
let interval = null;

/**
 * Connect to predefined host and port;
 */
const connect = () => {
    client.connect({port: settings.port});
}

/**
 * Set an interval that continuously tries
 * to connect to the origin server;
 */
const tryToConnect = () => {
    if (settings.debug) console.log(interval === null ? "Setting Interval" : "Interval Set");
    if(interval === null) {
        interval = setInterval(connect, 5000);
    }
}

/**
 * Action responder uppon a connection event.
 * Will only get triggered after a succesfull
 * invokation of the connect function;
 */
client.on('connect', () => {
    if (interval !== null) {
        clearInterval(interval);
        interval = null;
    }
});

/**
 * Action responder uppon being invoked
 * from the server;
 */
client.on('data', (response) => {
    const jsonResponse = JSON.parse(response);
    const { id, load } = jsonResponse;
    if(settings.debug) console.log(`${id} :: Received Load - ${load}`);
    const data = workFunction(jsonResponse);
    const jsonData = JSON.stringify({
        id,
        load,
        data,
    });
    client.write(jsonData);
});

/**
 * Action responder when an error is being thrown;
 */
client.on('error', () => {
    tryToConnect();
});

connect();
