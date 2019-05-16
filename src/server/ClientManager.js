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

    /**
     * Keeps track of the clients that can accept 
     */
    this.freeClients = new Set();
  }

  /**
   * Add a new client.
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  addClient(client){
    this.clients.add(client);
    this.setClientFree(client);
  }

  /**
   * Remove an existing client.
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  removeClient(client){
    this.clients.delete(client);
    this.freeClients.delete(client);
  }

  /**
   * @returns {Set} Set of all the clients that can accept work
   */
  getFreeClients(){
    return this.freeClients;
  }

  /**
   * Marks the given client as non-busy.
   * 
   * @param {Function} callback Called with callback(err, client) when a client comes up free
   */
  setClientFree(client){
    this.freeClients.add(client);
    this.emit("Client Available");
  }

  setClientOccupied(client){
    this.freeClients.delete(client);
  }
}

module.exports = ClientManager;