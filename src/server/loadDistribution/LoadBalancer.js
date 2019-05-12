const util = require('../../Utilities.js'),
      from = 'In LoadBalancer.js';

class LoadBalancer {
    /**
     * This class is responsible for distributing a workload to each client;
     * 
     * @param {Object} clients
     * @param {Object} distribution The type of load distribution requested;
     * @param {String} distribution.type The type of load distribution requested;
     * @param {Number: Optional} distribution.size The type of load distribution requested;
     * @param {Array} load The array containing all unique tasks that we
     * want to distribute accross all connected Clients;
     */
    constructor(clients, distribution, load) {
        if (!Object.keys(distribution).length) util.error('Type is an empty object', from);
        this.distribution = distribution;

        if (!load.length) util.error('Load is an empty array', from);
        this.load = load;

        //The tasks that have been successfully completed by the client;
        this.handledTasks = [];

        //Distribute a single task
        const single = () => {
            return !this.load.length ?
                []
            :
                this.load.shift();
        };

        //Distribute an array of tasks
        const chunck = (size=2) => {
            if(size <= 1 || this.load.length <= 1) return single();

            if (size >= this.load.length) size = this.load.length;

            const returnLoad = this.load.slice(0, size);

            this.getLoad(size);
            
            return returnLoad;
        }

        const types = {
            single,
            chunck: () => chunck(distribution.size),
        };

        if (!Object.keys(types).includes(distribution.type)) util.error('Invalid Distribution Type', from);

        this.types = types;
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

    getDistributionTask() {
        return this.types[this.distribution.type]();
    }

    addHandledTask(task) {
        this.handledTasks.push(task);
        
        return task;
    }
}

module.exports = LoadBalancer;
