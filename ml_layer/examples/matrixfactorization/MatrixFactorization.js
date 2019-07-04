import Utils from '../../src/Utils';
import ParameterMatrix from '../../src/ParameterMatrix';
import SparseDistArray from '../../src/SparseDistArray';

  /**
   * SGD Matrix factorization loop body.
   * This function calculates the updates on the parameters in W and H based on one data row.
   *
   * @param e_idx is are the indices of the SparseDistArray (So [user, movie])
   * @param e_val is the value of the corresponding index. So for the MF situation it is the rating the user gave to the movie.
   * @param parameters Parameters necessary to perform the computations. This one contains W and H.
   * @param hyperparameters Hyperparameters such as the learning rate.
   */
function work_function(e_idx, e_val, parameters, hyperparameters) {
    let user = e_idx[0];
    let movie = e_idx[1];
    let rating = e_val;

    let W = parameters.W;
    let H = parameters.H;

    // Compute the error, which is necessary for computing the updates.
    let predictedRating = Utils.dotDicts(H.getRow(movie), W.getRow(user));
    let error = rating - predictedRating;

    // Iterate over features
    for(let idx_f = 0; idx_f < hyperparameters.get('featureCount'); idx_f++) {
        let updatedW = W.get(user, idx_f) +
          hyperparameters.get('learningRate') * (2 * error * H.get(movie, idx_f) - hyperparameters.get('beta') * W.get(user, idx_f));
        W.update(user, idx_f, updatedW);
        let updatedH = H.get(movie, idx_f) +
          hyperparameters.get('learningRate') * (2 * error * W.get(user, idx_f) - hyperparameters.get('beta') * H.get(movie, idx_f));
        H.update(movie, idx_f, updatedH);
    }
}

/**
 * Partition the parameters.
 *
 * @param {Object} parameters
 * @param {Number} workerCount
 * @param {Number} totalTimesteps
 * @returns {Array} partitions
 */
function partition(parameters, workerCount, totalTimesteps) {
    let W = parameters.W;
    let H = parameters.H;

    let userCount = W.m;
    let movieCount = H.m;

    // Use the chunk util function to evenly divide the partition space into
    // workerCount amount of chunks.
    let chunksUsers = Utils.chunkBeginEnd(userCount, workerCount);
    let chunksMovies = Utils.chunkBeginEnd(movieCount, workerCount);

    let partitions = [];

    // Create the partitions
    for(let W_idx = 0; W_idx < workerCount; W_idx++) {
        let paramPartition = {};

        let H_idx = (W_idx + totalTimesteps) % workerCount;

        paramPartition.W = W.getRows(chunksUsers[W_idx][0], chunksUsers[W_idx][1]);
        paramPartition.H = H.getRows(chunksMovies[H_idx][0], chunksMovies[H_idx][1]);

        let partition = {};
        // Add the partitionIdx, which is used again 
        // in the work function to determine what data to use.
        partition.partitionIdx = [W_idx, H_idx];
        partition.parameters = paramPartition;

        partitions.push(partition);
    }
    return partitions;
}

let previousLoss = 0;
/**
 * Guard function which determines when the algorithm should stop running.
 * In the case of Matrix Factorization, the algorithm stops when the loss does not change much 
 * anymore across iterations.
 *
 * @param {Numer} totalTimesteps
 * @returns
 */
function guard(totalTimesteps) {
    let iterationTimestep = totalTimesteps % hyperparameters.workerCount;
    let iteration = Math.floor(totalTimesteps / hyperparameters.workerCount);

    let currentLoss = loss(data, parameters);
    let result = !iterationTimestep && Math.abs(currentLoss - previousLoss) < 0.001;
    previousLoss = currentLoss;

    // Log out the current iteration and current loss.
    console.log(`Iteration: ${iteration}, Timestep: ${iterationTimestep}, Loss: ${currentLoss}`);

    return result;
}

/**
 * Computes the current error in using the parameter arrays
 * W and H and the training data.
 *
 * @param {SparseDistArray} data
 * @param {Array} parameters
 * @returns
 */
function loss(data, parameters) {
    let sum = 0;
    data.data.forEach((value, key) => {
        let idx = key.split(',').map(Number);

        let user = idx[0];
        let movie = idx[1];
        let rating = value;

        let predicted_rating = Utils.dot(parameters.W.getRow(user), parameters.H.getRow(movie));
        let sumTerm = Math.pow(rating - predicted_rating, 2);
        sum += sumTerm;
    });
    return sum;
}

/**
 * Generates a random Netflix data like dataset.
 * These are "ratings" from users for different movies.
 *
 * @param {Number} alpha the approximate percentage of records you want in the dataset
 * @param {Number} movieCount The amount of movies in the dataset
 * @param {Number} usersCount The amount of users in the dataset
 * @returns
 */
function generateRandomNetflixDataset(alpha, movieCount, usersCount) {
    let data = new SparseDistArray();
    for (var idx_u = 0; idx_u < usersCount; idx_u++) {
        for (var idx_m = 0; idx_m < movieCount; idx_m++) {
            if(Math.random() < alpha) {
                let rating = Math.floor(Math.random() * 5 + 1);
                data.add(idx_u, idx_m, rating);
            }
        }
    }
    return data;
}

/**
 * Function which helps to partition the data
 * This is used to create the initialData.
 * This function splits up the dataset into workerCount^2 chunks.
 * The partitionIdx is used at the worker side to select the correct data partition it should use.
 *
 * @param {SparseDistArray} data
 * @param {Number} userCount
 * @param {Number} movieCount
 * @param {Number} workerCount
 * @returns {Array} of SparseDistArrays
 */
function partitionData(data, userCount, movieCount, workerCount) {
    let dataPartitions = {};

    let chunksUsers = Utils.chunkBeginEnd(userCount, workerCount);
    let chunksMovies = Utils.chunkBeginEnd(movieCount, workerCount);

    data.data.forEach((value, key) => {
        let idx = key.split(',').map(Number);

        let user = idx[0];
        let movie = idx[1];

        let userPartition = -1;
        let moviePartition = -1;

        for(let idx = 0; idx < workerCount; idx++) {
            if(user >= chunksUsers[idx][0] && user <= chunksUsers[idx][1]) {
                userPartition = idx;
                break;
            }
        }
        for(let idx = 0; idx < workerCount; idx++) {
            if(movie >= chunksMovies[idx][0] && movie <= chunksMovies[idx][1]) {
                moviePartition = idx;
                break;
            }
        }
        let nKey = [userPartition, moviePartition].toString();
        if(!(nKey in dataPartitions)) {
            dataPartitions[nKey] = new Map();
        }
        dataPartitions[nKey].set(key, value);

    });
    return dataPartitions;
}

// Define the hyperparameters, parameters, and initialData required by the system.
let hyperparameters = {};
hyperparameters.userCount = 100;
hyperparameters.movieCount = 80;
hyperparameters.workerCount = 1;
hyperparameters.featureCount = 5;
hyperparameters.learningRate = 0.002;
hyperparameters.beta = 0.02;

let parameters = {};
let initialData = {};
let hp = hyperparameters;

// Create a random Netflix like dataset.
let data = generateRandomNetflixDataset(0.6, hp.movieCount, hp.userCount);

// Create and randomly initialize the parameters
parameters.W = new ParameterMatrix(hp.userCount, hp.featureCount);
parameters.W.randomize();
parameters.H = new ParameterMatrix(hp.movieCount, hp.featureCount);
parameters.H.randomize();

// Create the initialData from the data.
let dataPartitions = partitionData(data, hyperparameters.userCount, hyperparameters.movieCount, hyperparameters.workerCount);
Object.keys(dataPartitions).map((x) => dataPartitions[x] = [...dataPartitions[x]]);
initialData.data = dataPartitions;
initialData.hyperparameters = Object.entries(hyperparameters);

// This variable can be used to select whether the volunteers should use the WebAssembly version of the work
// function or the JS version.
let use_wasm = true;

export {partition, partitionData, work_function, loss, guard, data, parameters, hyperparameters, initialData, use_wasm};