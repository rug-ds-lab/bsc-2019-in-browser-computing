const socketio = require('socket.io'),
    express = require('express'),
    EventEmitter = require('events'),
    util = require('../Utilities.js');

class Server extends EventEmitter {
    constructor({httpServer, port, clientManager}){
        super();

        this.port = port || 3000;
        this.httpServer = httpServer || express().listen(this.port);
        this.clientManager = clientManager; //TODO: Maybe remove this and communicate with events through the stream?
        
        this.dataSendingRunning = false;
        this.allDataHasBeenProcessed = false;

        this.start();
    }

    start(){
        this.io = socketio(this.httpServer);
        this.io.on('connection', this.addClient.bind(this));
        this.dataSendingRunning = true;
    }
    
    addClient(client){
        client.data = new Set();
        this.clientManager.addClient(client);
        client.on("disconnect", this.removeClient.bind(this, client));
    }
    
    removeClient(client, reason){
        this.clientManager.removeClient(client);
        this.emit("disconnect", client);
    }

    sendData(client, datas){
        const strippedData = datas.map(data => data.data);
        client.emit("data", strippedData, this.handledataHandler.handleResult.bind(this, client, datas));
    }

    handleResult(client, datas, results){
        // util.debug(true, "Received result");

        client.data.clear();
        datas.forEach((data, i) => this.emit("result", data, results[i])); //TODO: Better way?
        this.clientManager.setClientFree(client);
    }
}

module.exports = Server;