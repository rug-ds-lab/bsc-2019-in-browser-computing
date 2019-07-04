
class Utils {
    /**
     * Returns the dot product of two arrays.
     *
     * @static
     * @param {Array} arr1
     * @param {Array} arr2
     * @returns {Number}
     * @memberof Utils
     */
    static dot(arr1, arr2) {
        return arr1.reduce((r,a,i) => {return r+a*arr2[i]},0);
    }

    /**
     * Returns the dot product of two arrays stored as dicts.
     *
     * @static
     * @param {Object} arr1d
     * @param {Object} arr2d
     * @returns {Number}
     * @memberof Utils
     */
    static dotDicts(arr1d, arr2d) {
        let arr1 = Object.values(arr1d);
        let arr2 = Object.values(arr2d);

        return arr1.reduce((r,a,i) => {return r+a*arr2[i]},0);
    }

    /**
     * Chunks an array. Can be used with the partition functions
     * e.g.:
     * chunkParamArray([1,2,3,4,5,6], 3)
     * returns
     * [[1,2],[3,4],[5,6]]
     *
     * @static
     * @param {Array} array
     * @param {Number} parts
     * @returns {Array}
     * @memberof Utils
     */
    static chunkParamArray(array, parts){

        var idx = 0;
        var len = array.length;
        var result = [];

        while (idx < len) {
            let size = Math.ceil((len - idx) / parts--);
            result.push(array.slice(idx, idx += size));
        }
        return result;
    }

    /**
     * Chunks an array. Can be used with the partition functions
     * e.g.:
     * chunkParamArray(6, 3)
     * returns
     * [2,2,2]
     *
     * @static
     * @param {Number} len
     * @param {Number} parts
     * @returns {Array}
     * @memberof Utils
     */
    static chunkParamArraySizes(len, parts){

        var idx = 0;
        var result = [];

        while (idx < len) {
            let size = Math.ceil((len - idx) / parts--);

            result.push(size);
            idx += size;
        }
        return result;
    }

    /**
     * Chunks an array. Can be used with the partition functions
     * e.g.:
     * chunkBeginEnd(7, 3)
     * returns
     * [[0, 2], [3, 4], [5, 6]]
     *
     * @static
     * @param {Number} len
     * @param {Number} parts
     * @returns {Array}
     * @memberof Utils
     */
    static chunkBeginEnd(len, parts) {
        var idx = 0;
        var result = [];
        let beginParam = 0;
        while (idx < len) {
            let size = Math.ceil((len - idx) / parts--);
            let endParam = beginParam + size - 1;

            result.push([beginParam, endParam]);

            beginParam = endParam + 1;
            idx += size;
        }

        return result;

    }
}

module.exports = Utils;