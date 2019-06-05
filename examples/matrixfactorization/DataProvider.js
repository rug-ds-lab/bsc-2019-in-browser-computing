const SparseDistArray = require('./SparseDistArray');

class DataProvider {
    constructor(users_count, movie_count) {

        this.users_count = users_count;
        this.movie_count = movie_count;
        this.data = [];
    }

    /**
     * Generate random MF data based on the Netflix dataset.
     * TODO: Figure out whether it possible to use a random seed in JS somehow.
     *
     * @param alpha Threshold to decide whether a data point will be generated.
     * @param movieCount Amount of movies
     * @param usersCount Amount of users
     */
    static generateRandomSparseData(alpha, movieCount, usersCount) {
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

module.exports = DataProvider;