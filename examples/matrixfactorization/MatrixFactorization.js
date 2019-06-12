const SparseDistArray = require('./SparseDistArray');
const ParameterMatrix = require('./ParameterMatrix');

const Utils = require('./Utils');


class MatrixFactorization {
    constructor() {
      this.userCount = 100;
      this.movieCount = 80;
      this.featureCount = 3;
      this.workerCount = 1;

      this.learningRate = 0.002;
      this.beta = 0.02;

      this.data = this.generateRandomNetflixDataset(0.6, this.movieCount, this.userCount);
      this.parameters = {};
      this.parameters.W = new ParameterMatrix(this.userCount, this.featureCount);
      this.parameters.W.randomize();
      this.parameters.H = new ParameterMatrix(this.movieCount, this.featureCount);
      this.parameters.H.randomize();
    }

    /**
     * Computes the current error in using the parameter arrays (this.W and this.H) and the training data (this.ratings).
     */
    loss() {
        let sum = 0;
        this.data.data.forEach((value, key) => {
            let idx = key.split(',').map(Number);

            let user = idx[0];
            let movie = idx[1];
            let rating = value;

            let predicted_rating = Utils.dot(this.parameters.W.getRow(user), this.parameters.H.getRow(movie));
            let sumTerm = Math.pow(rating - predicted_rating, 2);
            sum += sumTerm;
        });
        return sum;
    }

    generateRandomNetflixDataset(alpha, movieCount, usersCount) {
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

    loop_body() {
        
    }

    algorithm() {
        // while(diffLoss > 10) {
        //     for(data in this.data) {
        //         loop_body() {

        //         }
        //     }
        // }
    }
}

module.exports = MatrixFactorization;



