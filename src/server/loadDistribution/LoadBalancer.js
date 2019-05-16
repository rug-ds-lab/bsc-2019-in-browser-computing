const util = require('../../Utilities.js'),
      from = 'In LoadBalancer.js';

class LoadBalancer {
    /**
     * This class is responsible for distributing a workload to each client;
     * 
     * @param {Object} clients
     * @param {Object} distribution The type of load distribution requested;
     * @param {String} distribution.type The type of load distribution requested;
     * @param {Number | Optional} distribution.size The type of load distribution requested;
     * @param {Array} load The array containing all unique tasks that we
     * want to distribute accross all connected Clients;
     */
    constructor(clients, distribution, load) {
        this.validateObject(clients, 'No clients');
        this.clients = clients;

        this.validateObject(distribution, 'Type is an empty object');
        this.distribution = distribution;

        if (!load.length) util.error('Load is an empty array', from);
        this.load = load;

        this.averageResponseTime = this.averageResponseTime();

        /**
         * Distribute a singular task to the client;
         */
        const single = () => {
            return !this.load.length ?
                []
            :
                this.load.shift();
        };

        /**
         * Distribute an array of tasks to the client;
         * 
         * @param {Number} size 
         */
        const chunck = (size=this.distribution.size) => {
            if(size <= 1 || this.load.length <= 1) return single();

            if (size >= this.load.length) size = this.load.length;

            const returnLoad = this.load.slice(0, size);

            this.getLoad(size);
            
            return returnLoad;
        }

        /**
         * Distribute tasks based on the response time of
         * each client;
         * 
         * @param {Number} id 
         */
        const adaptive = (id) => {
            const {load, responseTime} = this.clients[id];

            const avgClientTimePerTask = responseTime / load;
            const missedTasks = (this.averageResponseTime - avgClientTimePerTask) * load;
            const deltaLoad = missedTasks / avgClientTimePerTask;
            const adaptedLoad = Math.floor(deltaLoad + load);

            return chunck(adaptedLoad);
        }

        const types = {
            single,
            chunck: () => chunck(),
            adaptive: (id) => adaptive(id),
        };

        if (!Object.keys(types).includes(distribution.type)) util.error('Invalid Distribution Type', from);

        this.types = types;
    }

    /**
     * Compute the average response time of all clients;
     * 
     * @returns {Number} 
     */
    averageResponseTime() {
        let avgLoad = 0;
        let avgResponseTime = 0;
        const clients = this.clients;

        Object.keys(clients).forEach((id) => {
            const { load, responseTime } = clients[id];
            avgLoad += load;
            avgResponseTime += responseTime;
        });

        return Math.floor(avgResponseTime / avgLoad);
    }

    /**
     * This function either serves as a way to get the load array
     * or as a helper split function;
     * 
     * @param {Number} size the of the first n elements that will be removed;
     */
    getLoad(size=0) {
        if(size === 0) return this.load;

        this.load = this.load.splice(size);
        
        return this.load;
    }

    /**
     * Return the amount of tasks to the client;
     * 
     * @param {Number | Optional} id 
     */
    getDistributionTask(id=0) {
        const type = this.distribution.type;

        if(type === 'adaptive') {
            return this.types[type](id);
        }

        return this.types[type]();
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
}

module.exports = LoadBalancer;
