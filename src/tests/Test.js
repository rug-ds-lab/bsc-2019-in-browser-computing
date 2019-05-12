'use strict';

const LoadBalancer = require('../server/loadDistribution/LoadBalancer.js');
const _assert = require('assert');
/**
 * 
 * @param {Boolean} boolean 
 */
const assert = (boolean) => {
    _assert(boolean, "Assertion Failed")
}

const generateRandomClients = (seed=10) => {
    const types = ['single', 'chunk', 'adjustable'];
    const getRandomInt = (min, max) => {
        const nmin = Math.ceil(min);
        const nmax = Math.floor(max);
        //The maximum is exclusive and the minimum is inclusive
        return Math.floor(Math.random() * (nmax - nmin)) + nmin;
    };

    const clients = {};

    for(let i = 0; i < seed; i++) {
        clients[i] = {
            load: getRandomInt(1, 5),
            loadType: types[getRandomInt(0, 3)],
            //miliseconds
            responseTime: getRandomInt(100, 800),
            rating: getRandomInt(-1, 11),
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

const testLoadBalancerAdjustableResponseTime = () => {
    console.log(generateRandomClients());
}

const tests = {
    testLoadBalancerSingle,
    testLoadBalancerChunk,
    testLoadBalancerAdjustableResponseTime,
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
