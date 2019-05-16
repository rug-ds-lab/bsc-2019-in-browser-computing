'use strict';

const _assert = require('assert');

module.exports = {
    debug: (debug, message) => {
        if(debug) console.log(message);
    },
    error: (message, from='') => {
        throw new Error(`${message} - ${from}`);
    },
    assert: (boolean) => {
        _assert(boolean, "Assertion Failed")
    },
    nextInt: (min, max) => {
        const nmin = Math.ceil(min);
        const nmax = Math.floor(max);
        //The maximum is exclusive and the minimum is inclusive
        return Math.floor(Math.random() * (nmax - nmin)) + nmin;
    },
}
