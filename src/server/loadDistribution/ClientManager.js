const util = require('../../Utilities.js'),
      from = 'In ClientManager.js';

class ClientManager {

    /**
     * Manage 
     * @param {Object} clients 
     * @param {Number} clients.load
     * @param {String} clients.loadType
     * @param {Number} clients.responseTime
     * @param {Number} clients.rating
     */
    constructor(clients) {
        if(!Object.keys(clients).length) util.error('No clients', from);
        this.clients = clients;
    }

    computeClientRating(id, taskInMilis=100) {
        const { load, responseTime } = this.clients[id];
        
        const denominator = load * taskInMilis;
        const negativeWeight = Math.floor(responseTime / denominator);
        
        return 10 - negativeWeight;
    }
}

module.exports = ClientManager;
