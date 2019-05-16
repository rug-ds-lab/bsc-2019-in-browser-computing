'use strict';

const EventEmitter = require('events');

/**
 * This class intends to provide an easy interface for the server to keep
 * track of connected clients.
 */
class ClientManager extends EventEmitter{

  constructor(){
    super();

    this.clients = new Set();
  }

  /**
   * Add a new client.
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  addClient(client){
    client.data = new Set();
    this.clients.add(client);
    client.on("disconnect", this.removeClient.bind(this, client));
  }

  /**
   * Remove an existing client.
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  removeClient(client){
    this.clients.delete(client);
    this.emit("disconnection", client);
  }

  /**
   * @returns {Set} Set of all the clients that can accept work
   */
  getClients(){
    return this.clients;
  }
}

module.exports = ClientManager;
