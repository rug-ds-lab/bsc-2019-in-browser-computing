'use strict';

module.exports = {
  debug: (debug, message) => {
    if(debug){
      console.log(message);
    }
  },
  error: (message) => {
      throw new Error(message);
  }
}
