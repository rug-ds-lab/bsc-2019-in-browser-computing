'use strict';

const LoadBalancer = require('../server/LoadBalancer.js');
const { assert, nextInt } = require('../Utilities.js');

const generateRandomClients = (seed=10) => {
    const types = ['single', 'chunk', 'adjustable'];
    const clients = {};
    const loadType = types[nextInt(0, 3)];
    for(let i = 0; i < seed; i++) {
        clients[i] = {
            load: nextInt(1, 300),
            loadType,
            responseTime: nextInt(400, 3 * 60000),
            rating: 0,
        };
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
    // const clients = generateRandomClients();
    // const steps = [];
    // for(let i = 0; i < 10000; i++) steps.push(i);

    // const loadBalancer = new LoadBalancer(clients, {
    //     type: 'adaptive',
    // }, steps);

    // Object.keys(clients).forEach((id) => {
    //     loadBalancer.getDistributionTask(id);
    // });
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
