'use strict';

/**
 * This is an empty module intended to unify the Client and Server
 * parts of the project.
 * TODO: Find a better name.
 */

const Client = require('./client/Client.js'),
      Server = require('./server/Server.js');

module.exports = {
    Client, 
    Server,
};
