const SparseDistArray = require('./SparseDistArray'),
    Utils = require('./Utils');

class MatrixFactorization {
    constructor() {
      this.userCount = 100;
      this.movieCount = 80;
      this.featureCount = 50;
      this.workerCount = 5;

      this.ratings = generateRandomSparseData(0.6, this.movieCount, this.userCount);

      this.W = new SparseDistArray(2);
      this.W.randomize(this.userCount, this.featureCount);
      this.H = new SparseDistArray(2);
      this.H.randomize(this.movieCount, this.featureCount);
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
                let predicted_rating = Utils.dotDicts(this.H.getRow(movie), this.W.getRow(user));

                let sumTerm = Math.pow(rating - predicted_rating, 2);
                sum += sumTerm;
            }
        }
        return sum;
    }

    generateRandomSparseData(alpha, movieCount, usersCount) {
        let data = new SparseDistArray(2);
        for (var idx_m = 0; idx_m < movieCount; idx_m++) {
            for (var idx_u = 0; idx_u < usersCount; idx_u++) {
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



