'use strict';

const LoadBalancer = require('../server/loadDistribution/LoadBalancer.js');
const ClientManager = require('../server/loadDistribution/ClientManager.js');
const {assert, nextInt} = require('../Utilities.js');

const generateRandomClients = (seed=10) => {
    const types = ['single', 'chunk', 'adjustable'];
    const clients = {};

    for(let i = 0; i < seed; i++) {
        clients[i] = {
            load: nextInt(1, 5),
            loadType: types[nextInt(0, 3)],
            //miliseconds
            responseTime: nextInt(100, 800),
            rating: 0,
        };
    }

    return clients;
}

const testLoadBalancerSingle = () => {
    const loadBalancer = new LoadBalancer([], {
        type: 'single'
    }, [1, 2, 3, 4, 5, 6, 7]);

    [1, 2, 3, 4, 5, 6, 7].forEach((item) => {
        assert(loadBalancer.getDistributionTask() === item);
    });
    assert(loadBalancer.getDistributionTask().length === [].length);
}

const testLoadBalancerChunk = () => {
    const loadBalancer = new LoadBalancer([], {
        type: 'chunck',
        size: 2,
    }, [1, 2, 3, 4, 5, 6, 7]);

    const testLoadBalancer = {
        test1: [1, 2],
        test2: [3, 4],
        test3: [5, 6],
        test4: [7],
        test5: [],
        test6: [],
    };
    Object.keys(testLoadBalancer).forEach((key) => {
        assert(loadBalancer.getDistributionTask().toString() === testLoadBalancer[key].toString());
    });
}

const testClientManagerRating = () => {
    const clients = generateRandomClients();
    const clientManager = new ClientManager(clients);

    Object.keys(clients).forEach((client) => {
        console.log('rating', clientManager.computeClientRating(client));
    });
}

const tests = {
    testLoadBalancerSingle,
    testLoadBalancerChunk,
    testClientManagerRating,
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
