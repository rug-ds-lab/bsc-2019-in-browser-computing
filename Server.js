'use strict';

const net = require('net');
const { settings, stepFunction } = require('./Setup');

const clientData = {};
let id = -1;

/**
 * Create a server and listen for Incomming connections;
 */
const server = net.createServer((connection) => {
    //Create a unique id - Math.floor(Math.random() * 1e10).toString();
    id++;
    const data = {
        id,
        load: stepFunction(),
    };    

    /**
     * Action responder uppon the client finishing
     * one step;
     */
    connection.on('data', (response) => {
        const {id, load, data} = JSON.parse(response);
        clientData[id] = {
            id,
            load: stepFunction(),
            data,
        };
        const jsonData = JSON.stringify(clientData[id]);
        if (settings.debug) console.log(`${id} :: [${load}] - ${data}`);
        connection.write(jsonData);
    });

    /**
     * Remove the connection when the client dies;
     */
    connection.on('end', () => {
        delete clientData[id];
    });

    connection.write(JSON.stringify(data));
});

server.listen(settings.port, () => {
    console.log('Listening...');
});

