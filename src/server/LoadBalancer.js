const util = require('../Utilities.js'),
      from = 'In LoadBalancer.js';

class LoadBalancer {
    /**
     * This class is responsible for distributing a workload to each client;
     * 
     * @param {ClientManager} 
     * @param {Object} distribution The type of load distribution requested;
     * @param {String} distribution.type The type of load distribution requested;
     * @param {Number} distribution.size The default amount that we want to distribute;
     */
    constructor(clientManager, distribution) {
        this.clientManager = clientManager;

        this.distribution = distribution;

        /**
         * Distribute an array of tasks to the client;
         * 
         * @param {Number} size 
         */
        const chunk = (size=this.distribution.size) => {
            return size;
        }

        /**
         * Distribute tasks based on the response time of
         * each client;
         * 
         * @param {Socket} client
         */
        const adaptive = (client) => {
            const {lastDataCount, lastResponseTime, lastSendTime} = client.load;
            const averageResponseTime = this.averageResponseTime();

            if(!lastDataCount || !averageResponseTime){
                return chunk();
            }
            const avgClientTimePerTask = (lastResponseTime - lastSendTime) / lastDataCount;
            const missedTasks = (averageResponseTime - avgClientTimePerTask) * lastDataCount;
            const deltaLoad = missedTasks / avgClientTimePerTask;
            let res = Math.ceil(deltaLoad + lastDataCount);
            if(res < 0){
                res = lastDataCount;
            }
            return res;
        }

        const types = {
            single: () => 1,
            chunk,
            adaptive
        };

        this.types = types;
    }

    /**
     * Compute the average response time of all clients;
     * @returns {Number} 
     */
    averageResponseTime() {
        let count = 0;
        let totalAverage = 0;
        
        this.clientManager.clients.forEach(client => {
            if(!client.load.lastResponseTime){
                return;
            }
            totalAverage += (client.load.lastResponseTime - client.load.lastSendTime)/client.load.lastDataCount;
            count++;
        });

        return count ? totalAverage/count : 0;
    }

    /**
     * Return the amount of tasks to the client;
     * 
     * @param {Socket} client
     * @returns {Number} Number of tasks to send ideally
     */
    getTaskSize(client) {
        const distributionFunction = this.types[this.distribution.type];

        if (this.distribution.type !== 'adaptive') {
            return distributionFunction();
        }

        return distributionFunction(client);
    }

    /**
     * Check if the object is empty;
     * 
     * @param {Object} object the object;
     * @param {String} error the error;
     */
    validateObject(object, error) {
        if (!Object.keys(object).length) util.error(error, from);
    }

    initializeClient(client){
        client.load = {
            lastResponseTime: 0,
            lastDataCount: 0,
            lastSendTime: 0
        };
    }
}

module.exports = LoadBalancer;
