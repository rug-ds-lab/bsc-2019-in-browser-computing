
/**
 * This class is intended to store sparse data.
 *
 * @class SparseDistArray
 */
class SparseDistArray {
    /**
     * Creates an instance of SparseDistArray.
     * Stores data in a map, using comma separated strings as keys.
     * e.g. "1,2": 5
     * has value 5 stored in location m:1, n:2.
     *
     * Used in combination with the ParameterMatrix.
     *
     * @memberof SparseDistArray
     */
    constructor() {
        this.data = new Map();
    }

    /**
     * Adds a new datapoint to the object.
     *
     * @param {Number} m
     * @param {Number} n
     * @param {Number} val
     * @memberof SparseDistArray
     */
    add(m, n, val) {
        this.data.set([m, n].toString(), val);
    }

    /**
     * Returns the value at location m, n
     *
     * @param {Number} m
     * @param {Number} n
     * @returns {Number}
     * @memberof SparseDistArray
     */
    get(m, n) {
        return this.data.get([m, n].toString());
    }

    /**
     * Returns the size of the map.
     *
     * @returns {Number}
     * @memberof SparseDistArray
     */
    size() {
        return this.data.size;
    }
}

module.exports = SparseDistArray;
