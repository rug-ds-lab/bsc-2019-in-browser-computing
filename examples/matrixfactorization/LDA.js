const SparseDistArray = require('./SparseDistArray');
const ParameterMatrix = require('./ParameterMatrix');
const fs = require('fs');
const { promisify } = require('util');
const Utils = require('./Utils');


class LDA {
    constructor() {

    //   this.userCount = 100;
    //   this.movieCount = 80;
      this.workerCount = 3;

      this.hyperparameters = {};
      this.hyperparameters.topicCount = 3;
      this.hyperparameters.alpha = 0.002;
      this.hyperparameters.beta = 0.02;

    //   this.data = this.generateRandomNetflixDataset(0.6, this.movieCount, this.userCount);

      this.parameters = {};
      this.parameters.phi = new ParameterMatrix(); // parts versus topics
      this.parameters.theta = new ParameterMatrix(); // composite versus topics

      this.stopWords = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"];
    //   this.parameters.W = new ParameterMatrix(this.userCount, this.hyperparameters.featureCount);
    //   this.parameters.W.randomize();
    //   this.parameters.H = new ParameterMatrix(this.movieCount, this.hyperparameters.featureCount);
    //   this.parameters.H.randomize();


    }

    async initialize() {
        let data = await fs.promises.readFile('./examples/matrixfactorization/data/nytimes-5rows.csv', "utf8");
        let splitData = data.split('\n');
        splitData.shift();
        let strings = splitData.map(str => str.split('"')[1]);
        var regex = /[.,'();:!]/g;
        let tokens = strings.map((str) => str.toLowerCase().replace(regex, '').split(' '));
        this.stopWords.map(stopWord => delete tokens[stopWord]);

        let wordTopicAssignment = [];
        tokens.map(string => {
          let res = {};
          string.map((x) => res[x] = Math.floor(Math.random() * this.hyperparameters.topicCount));
          wordTopicAssignment.push(res);
        });

        let wordPerTopic = this.wordTopicCounts(wordTopicAssignment);
        let documentVsTopic = wordTopicAssignment.map(this.topicFrequency);

        console.log(wordPerTopic);

        Object.entries(wordPerTopic).map((x) => {
          let word = x[0];
          let topicCounts = x[1];
          console.log(word, topicCounts);
          
          let ts = [...Array(this.hyperparameters.topicCount).keys()].map(idx => {
            (topicCounts[idx] + this.beta)
                /
              ((emojiDoc0Topic0 + this.alpha) / emojiDoc0aTopic + this.topicCount * this.alpha);
          });
        });

    }

    strFrequency(wordArray) {
      return wordArray.reduce((count, word) => {
        count[word] = (count[word] || 0) + 1;
        return count;
      }, {})
    }

    wordTopicCounts(wordTopicAssignments) {
      let totals = {};
      wordTopicAssignments.map((x) => {
        Object.entries(x).map((value) => {
          if(!(value[0] in totals)) {
            totals[value[0]] = {};
            [...Array(this.hyperparameters.topicCount).keys()].map(idx => totals[value[0]][idx] = 0);
          }
          totals[value[0]][value[1]] += 1;
        });
      });
      return totals;
    }

    topicFrequency(wordCounts) {
      return Object.entries(wordCounts).reduce((count, word) => {
        count[word[1]] = (count[word[1]] || 0) + 1;
        return count;
      }, {})
    }

    /**
     * Computes the current error in using the parameter arrays (this.W and this.H) and the training data (this.ratings).
     */
    // loss() {
    //     let sum = 0;
    //     this.data.data.forEach((value, key) => {
    //         let idx = key.split(',').map(Number);

    //         let user = idx[0];
    //         let movie = idx[1];
    //         let rating = value;

    //         let predicted_rating = Utils.dot(this.parameters.W.getRow(user), this.parameters.H.getRow(movie));
    //         let sumTerm = Math.pow(rating - predicted_rating, 2);
    //         sum += sumTerm;
    //     });
    //     return sum;
    // }

    // generateRandomNetflixDataset(alpha, movieCount, usersCount) {
    //     let data = new SparseDistArray();
    //     for (var idx_u = 0; idx_u < usersCount; idx_u++) {
    //         for (var idx_m = 0; idx_m < movieCount; idx_m++) {
    //             if(Math.random() < alpha) {
    //                 let rating = Math.floor(Math.random() * 5 + 1);
    //                 data.add(idx_u, idx_m, rating);
    //             }
    //         }
    //     }
    //     return data;
    // }

    // loop_body() {

    // }

    // algorithm() {
    //     // while(diffLoss > 10) {
    //     //     for(data in this.data) {
    //     //         loop_body() {

    //     //         }
    //     //     }
    //     // }
    // }
}

module.exports = LDA;



