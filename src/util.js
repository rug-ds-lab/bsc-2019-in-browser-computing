'use strict';

module.exports = {
  debug: (debug, message) => {
    if(debug){
      console.log(message);
    }
  }
}