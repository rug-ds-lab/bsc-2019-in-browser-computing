'use strict';

module.exports = {
  debug: (debug, message) => {
    if(debug){
      console.log(message);
    }
  },

  /**
     * Iterate over an object.
     *
     * @param {Object} obj The object.
     * @param {Function} fn The callback to invoke on every property.
     *        Invoked as: fn(value, key, obj).
     * @return {Object} obj.
     */
    forEach: (obj, fn) => {
      for(var x in obj) {
        if(obj.hasOwnProperty(x)) {
          fn(obj[x], x, obj);
        }
      }

      return obj;
    }
}