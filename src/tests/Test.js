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

const testLoadBalancerSingle = () => {
    const loadBalancer = new LoadBalancer({
        type: 'single'
    }, [1, 2, 3, 4, 5, 6, 7]);

    [1, 2, 3, 4, 5, 6, 7].forEach((item) => {
        assert(loadBalancer.getDistributionTask() === item);
    });
    assert(loadBalancer.getDistributionTask().length === [].length);
}

const testLoadBalancerChunk = () => {
    const loadBalancer = new LoadBalancer({
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

const tests = {
    testLoadBalancerSingle,
    testLoadBalancerChunk,
};
Object.keys(tests).forEach((test, i) => {
    try {
        tests[test]();
        console.log(`${i} - ${test}() Passed`);
    } catch(e) {
        console.error(`${i} - ${test}() Failed`);
    }
});
