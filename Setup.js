'use strict';

/**
 * Define the port and host;
 */
const settings = {
    host: 'www.google.com',
    port: 5000,
    debug: true,
}

let maxLoad = -1;

/**
 * Define the step increments that each unique client
 * will perform;
 */
const stepFunction = () => {
    const step = 1;
    maxLoad += step;

    return maxLoad;
}

/**
 * Define the work load each unique client can have;
 * 
 * @param {*} response Object response from the server {id, load};
 * @return {*} ALWAYS return a value;
 */
const workFunction = (response) => {
    return fibonacci(response.load);
}

/**
 * Return the nth fibonacci number;
 * 
 * @param n the nth index;
 */
const fibonacci = (n) => {
    return n < 2 ?
        n
    :
        fibonacci(n - 1) + fibonacci(n - 2);
}

module.exports = {
    settings,
    workFunction,
    stepFunction,
};

