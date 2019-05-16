const socketio = require('socket.io'),
    express = require('express'),
    EventEmitter = require('events'),
    util = require('../Utilities.js');

class Server extends EventEmitter {
    constructor({httpServer, port}){
        super();

        this.port = port;
        this.httpServer = httpServer;
        
        this.dataSendingRunning = false;
        this.allDataHasBeenProcessed = false;

        this.start();
    }

    start(){
        this.io = socketio(this.httpServer);
        this.io.on('connection', client => this.emit('connection', client));
        this.dataSendingRunning = true;
    }

    sendData(client, datas){
        const strippedData = datas.map(data => data.data);
        client.emit("data", strippedData, this.handleResult.bind(this, client, datas));
    }

    handleResult(client, datas, results){
        client.data.clear();
        datas.forEach((data, i) => this.emit("result", data, results[i]));
        this.clientManager.setClientFree(client);
    }
}

module.exports = Server;