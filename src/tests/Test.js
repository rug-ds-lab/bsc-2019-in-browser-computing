'use strict';

const LoadBalancer = require('../server/LoadBalancer.js');
const ClientManager = require('../server/ClientManager.js');
const { assert, nextInt } = require('../Utilities.js');

const generateRandomClients = (seed=10) => {
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
    const averageSystemResponseTime = loadBalancer.averageResponseTime();
    
    clients.forEach((client) => {
        const { lastDataCount, lastSendTime, lastResponseTime } = client.load;
        const clientAverage = (lastResponseTime - lastSendTime) / lastDataCount;
        const newDataCount = loadBalancer.getTaskSize(client);
        // console.log(clientAverage, averageSystemResponseTime, lastDataCount, newDataCount);

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
