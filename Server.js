'use strict';

const net = require('net');
const { settings, stepFunction } = require('./Setup');
 
class Server {

    constructor() {
        this.state = {
            clientData: {},
            id: -1,
        };
        this.startServer();
    }

    /**
     * Create a server and listen for Incomming connections;
     */
    startServer() {
        const server = net.createServer((connection) => {
            //Create a unique id - Math.floor(Math.random() * 1e10).toString();
            this.state.id++;
            const id = this.state.id;
            
            const data = {
                id,
                load: stepFunction(),
            };

            /**
             * Action responder uppon the client finishing
             * one step;
             */
            connection.on('data', (response) => {
                const { id, load, data } = JSON.parse(response);
                this.state.clientData[id] = {
                    id,
                    load: stepFunction(),
                    data,
                };
                const jsonData = JSON.stringify(this.state.clientData[id]);
                if (settings.debug) console.log(`${id} :: [${load}] - ${data}`);
                connection.write(jsonData);
            });

            /**
             * Remove the connection when the client dies;
             */
            connection.on('end', () => {
                delete this.state.clientData[id];
            });

            connection.write(JSON.stringify(data));
        });

        server.listen(settings.port, () => {
            console.log('Listening...');
        });
    }
}

new Server();
