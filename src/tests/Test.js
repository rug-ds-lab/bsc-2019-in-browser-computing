'use strict';

const LoadBalancer = require('../server/LoadBalancer.js');
const ClientManager = require('../server/ClientManager.js');
const { assert, nextInt } = require('../Utilities.js');

const generateRandomClients = (seed = 10) => {
    const clients = [];

    for (let i = 0; i < seed; i++) {
        const lastDataCount = nextInt(1, 300);
        const lastSendTime = nextInt(400, 60000);
        const lastResponseTime = lastSendTime + nextInt(400, 60000);

        clients.push({
            load: {
                lastDataCount,
                lastSendTime,
                lastResponseTime,
            },
        });
    }

    return clients;
}

const testClientManager = () => {
    const clientManager = new ClientManager({ debug: false, testing: true });
    let size = 100;
    // Adding and removing concecutively 
    generateRandomClients(size).forEach((client) => {
        clientManager.addClient(client);
        assert(clientManager.clients.size === 1);
        clientManager.removeClient(client);
        assert(clientManager.clients.size === 0);
    });

    assert(clientManager.clients.size === 0);

    size = 20;

    const clients = generateRandomClients(size);
    // Checking if adding by itself works as expected;
    clients.forEach((client, index) => {
        clientManager.addClient(client);
        assert(clientManager.clients.size === index + 1);
    });

    assert(clientManager.clients.size === size);
    // Removing elements from the back while also checking count
    clients.reverse().forEach((client) => {
        clientManager.removeClient(client);
        size--;
        assert(clientManager.clients.size === size);
    });
    // Final checks
    assert(size === 0);
    assert(clientManager.clients.size === size);
}

const testLoadBalancerSingleChunk = () => {
    const types = [
        {
            type: 'single',
            size: 1,
        },
        {
            type: 'chunk',
            size: 400,
        },
        {
            type: 'chunk',
            size: 1,
        },
        {
            type: 'chunk',
            size: 10000,
        },
        {
            type: 'single',
            size: -1,
        },
    ];
    // Check if the distribution function is sending the correct amount of chunks
    types.forEach((type) => {
        const loadBalancer = new LoadBalancer(null, type);

        const size = loadBalancer.getTaskSize();
        
        if (type.type === 'single') {
            assert(size === 1);
        } else {
            assert(size === type.size);
        }
    });
}

const testLoadBalancerAdaptive = () => {
    const clients = generateRandomClients();
    const simulatedClientManager = {
        clients,
    };
    const loadBalancer = new LoadBalancer(simulatedClientManager, {
        type: 'adaptive',
        size: 200,
    });
    // Get System's averagre response time;
    const averageSystemResponseTime = loadBalancer.averageResponseTime();
    
    clients.forEach((client) => {
        const { lastDataCount, lastSendTime, lastResponseTime } = client.load;
        const clientAverage = (lastResponseTime - lastSendTime) / lastDataCount;
        const newDataCount = loadBalancer.getTaskSize(client);
        /**
         * Optional print if necessary
         * console.log(clientAverage, averageSystemResponseTime, lastDataCount, newDataCount);
         */
        // Check if the adaptive algorithm is giving more load to good workers and less for the bad ones;
        if (clientAverage >= averageSystemResponseTime) {
            assert(newDataCount <= lastDataCount);
        } else {
            assert(newDataCount >= lastDataCount);
        }
    });
}

const tests = {
    testLoadBalancerSingleChunk,
    testLoadBalancerAdaptive,
    testClientManager,
};
Object.keys(tests).forEach((test, i) => {
    try {
        tests[test]();
        console.log(`${i} - ${test}() Passed`);
    } catch(e) {
        console.error(e);
        console.error(`${i} - ${test}() Failed`);
    }
});
