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
        if (!Object.keys(clients).length) util.error('No clients', from);
        this.clients = clients;

        if (!Object.keys(distribution).length) util.error('Type is an empty object', from);
        this.distribution = distribution;

        if (!load.length) util.error('Load is an empty array', from);
        this.load = load;

        //The tasks that have been successfully completed by the client;
        this.handledTasks = [];

        this.averageResponseTime = this.averageResponseTime();

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

        const adaptive = (id) => {
            const {load, responseTime, rating} = this.clients[id];
            const avgClientTime = responseTime / load;
            const deltaLoad = ((this.averageResponseTime - avgClientTime) * load) / avgClientTime;
            const adaptedLoad = Math.floor(deltaLoad + load);
            
            console.log(this.averageResponseTime);
            console.log('R:' + rating + ' Response: ' + responseTime + ' pLoad: ' + load + ' nLoad: ' + adaptedLoad);

            return chunck(adaptedLoad);
        }

        const types = {
            single,
            chunck: () => chunck(distribution.size),
            adaptive: (id) => adaptive(id),
        };

        if (!Object.keys(types).includes(distribution.type)) util.error('Invalid Distribution Type', from);

        this.types = types;
    }

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

    computeClientRating(id, avgTask=this.averageResponseTime) {
        const { load, responseTime } = this.clients[id];

        const perfectLoad = responseTime / avgTask;

        return Math.floor(11 - perfectLoad / load);
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

    getDistributionTask(id=0) {
        const type = this.distribution.type;

        if(type === 'adaptive') {
            return this.types[type](id);
        }

        return this.types[type]();
    }

    addHandledTask(task) {
        this.handledTasks.push(task);
        
        return task;
    }
}

module.exports = LoadBalancer;
