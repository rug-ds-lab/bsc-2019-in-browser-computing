const SparseDistArray = require('./SparseDistArray');
const ParameterMatrix = require('./ParameterMatrix');

const Utils = require('./Utils');


class MatrixFactorization {
    constructor() {
      this.userCount = 1000;
      this.movieCount = 800;
      this.featureCount = 15;
      this.workerCount = 3;

      this.learningRate = 0.002;
      this.beta = 0.02;

      this.ratings = this.generateRandomNetflixDataset(0.6, this.movieCount, this.userCount);

      this.W = new ParameterMatrix(this.userCount, this.featureCount);
      this.W.randomize();
      this.H = new ParameterMatrix(this.movieCount, this.featureCount);
      this.H.randomize();
    }

    /**
     * Computes the current error in using the parameter arrays (this.W and this.H) and the training data (this.ratings).
     */
    loss() {
        let sum = 0;
        this.ratings.data.forEach((value, key) => {
            let idx = key.split(',').map(Number);

            let user = idx[0];
            let movie = idx[1];
            let rating = value;

            let predicted_rating = Utils.dot(this.W.getRow(user), this.H.getRow(movie));
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
}

module.exports = MatrixFactorization;



