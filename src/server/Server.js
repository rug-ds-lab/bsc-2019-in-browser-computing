const socketio = require('socket.io'),
express = require('express');

class Server{
    constructor({httpServer, port, clientManager}){
        this.port = port || 3000;
        this.httpServer = httpServer || express().listen(this.port);
        this.clientManager = clientManager;
        
        this.dataSendingRunning = false;
        this.allDataHasBeenProcessed = false; // TODO: Replace with a call to the server?
        
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
        client.emit("data", strippedData, this.handleResult.bind(this, client, datas));
    }

    handleResult(client, datas, results){
        util.debug(this.debug, "Received result");

        client.data.length = 0; // https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript
        datas.forEach((data, i) => this.dataSendingRunning(client, data, results[i]));
        this.clientManager.setClientFree(client);
    }
}

module.exports = Server;