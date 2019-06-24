'use strict';

const EventEmitter = require('events'),
  util = require('../Utilities.js');
/**
 * This class intends to provide an easy interface for the server to keep
 * track of connected clients.
 */
class ClientManager extends EventEmitter{

  constructor({debug}){
    super();

    this.clients = new Set();
    this.debug = debug;
  }

  /**
   * Add a new client.
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  addClient(client){
    client.data = new Set();
    util.debug(this.debug, "Client Connected");
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
    util.debug(this.debug, "Client Disconnected");
    this.emit("disconnection", client);
  }
}

module.exports = ClientManager;