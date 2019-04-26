'use strict';

const EventEmitter = require('events');

/**
 * This class intends to provide an easy interface for the server to keep
 * track of connected clients.
 */
class ClientManager extends EventEmitter{

  constructor(){
    super();

    /**
     * The keys are the socket ids, the values are the sockets themselves.
     */
    this.clients = {};

    /**
     * Keeps track of the clients that aren't doing anything right now.
     */
    this.freeClients = [];
  }

  /**
   * Add a new client.
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  addClient(client){
    this.clients[client.id] = client;
    this.setClientFree(client);
  }

  removeClient(client){
    delete this.clients[client.id];
    this.freeClients.splice(client.id, 1);
  }

  // gets and removes from free list
  getFreeClient(callback){
    if(this.freeClients.length){
      return callback(null, this.clients[this.freeClients.pop()]);
    }

    this.once("client-freed", this.getFreeClient.bind(this, callback));
  }

  setClientFree(client){
    this.freeClients.push(client.id);
    this.emit("client-freed");
  }
}

module.exports = ClientManager;