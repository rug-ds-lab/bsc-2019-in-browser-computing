'use strict';

module.exports = {
  debug: (debug, message) => {
    if(debug){
      console.log(message);
    }
  },
  error: (message, from='') => {
      throw new Error(`${message} - ${from}`);
  }
}
