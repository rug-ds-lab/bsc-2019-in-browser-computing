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
    this.freeClients.splice(client.id, 1);
  }

  /**
   * Returns one client that is currently not busy. A client that is requested
   * here should later be indicated as free through setClientFree function when they are
   * done with their job.
   * 
   * @param {Function} callback Called with callback(err, client) when a client comes up free
   */
  getFreeClient(callback){
    if(this.freeClients.length){
      return callback(null, this.clients[this.freeClients.pop()]);
    }

    this.once("client-freed", this.getFreeClient.bind(this, callback));
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
}

module.exports = ClientManager;