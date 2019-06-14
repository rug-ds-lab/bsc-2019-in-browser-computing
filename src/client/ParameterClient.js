'use strict';

class ParameterClient {
    constructor() {
        this.params = Map();
    }

    get(matrix, index) {
        // Get the local parameters for computations. Fetch when the "clock" is above the staleness threshold.
        if(matrix in this.params) {
            
        } else {

        }
    }

    fetch(matrix, index) {
        // Fetch the parameter(s) from the server, and set them locally.
    }

    set(matrix, index) {
        // Set the parameters locally

    }

    push(matrix, index) {
        // Push the local updates to the server.
    }
}

module.exports = ParameterClient;
