const DataProvider = require('./DataProvider');
const SparseDistArray = require('./SparseDistArray');
const ParameterMatrix = require('./ParameterMatrix');

const Utils = require('./Utils');


class MatrixFactorization {
    constructor() {
      this.userCount = 1000;
      this.movieCount = 800;
      this.featureCount = 15;
      this.workerCount = 1;

      this.ratings = DataProvider.generateRandomSparseData(0.6, this.movieCount, this.userCount);

      this.W = new ParameterMatrix(this.userCount, this.featureCount);
      this.W.randomize();
      this.H = new ParameterMatrix(this.movieCount, this.featureCount);
      this.H.randomize();

    //   console.log(this.H.data);

    //   this.W = new SparseDistArray(2);
    //   this.W.randomize(this.userCount, this.featureCount);
    //   this.H = new SparseDistArray(2);
    //   this.H.randomize(this.movieCount, this.featureCount);
    }

  /**
   * Computes the current error in using the parameter arrays (this.W and this.H) and the training data (this.ratings).
   */
    loss() {
        // Nonzero loss function
        let sum = 0;
        let users = Object.keys(this.ratings.data);
        for(let idx_m = 0; idx_m < users.length; idx_m++) {
            let user = users[idx_m];
            let movies = Object.keys(this.ratings.data[user]);
            for(let idx_n = 0; idx_n < movies.length; idx_n++) {
                let movie = movies[idx_n];
                let rating = this.ratings.data[user][movie];
                // console.log("User", user, " gave movie", movie, " a rating of", rating);
                // console.log(this.H.getRow(movie));
                let predicted_rating = Utils.dot(this.H.getRow(movie), this.W.getRow(user));

                let sumTerm = Math.pow(rating - predicted_rating, 2);
                sum += sumTerm;
            }
        }
        return sum;
    }
}

module.exports = MatrixFactorization;



