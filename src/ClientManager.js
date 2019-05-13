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

  /**
   * Remove an existing client.
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  removeClient(client){
    delete this.clients[client.id];
    this.freeClients.splice(this.freeClients.indexOf(client.id), 1);
  }

  /**
   * Get an array of all the clients that are free right now
   * 
   * @returns {Array} Array with the IDs of freeclients
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
    this.freeClients.push(client.id);
    this.emit("client-freed");
  }

  setClientOccupied(client){
    this.freeClients = this.freeClients.filter(el => el !== client.id);
  }
}

module.exports = ClientManager;