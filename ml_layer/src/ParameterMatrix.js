/**
 * ParameterMatrix which is used to store parameters.
 * This class provides some abstractions which make working with
 * matrices easier. It stores all of the data in a flat typed array.
 */
class ParameterMatrix {

    /**
     *Creates an instance of ParameterMatrix.
     * ParameterMatrix which is used to store parameters.
     * This class provides some abstractions which make working with
     * matrices easier. It stores all of the data in a flat typed array.
     *
     * @param {Number} m Length in dim 1
     * @param {Number} n Length in dim 2
     * @memberof ParameterMatrix
     */
    constructor(m, n) {
        this.m = m;
        this.n = n;
        this.begin_m = 0;
        this.end_m = m - 1;
        this.begin_n = 0;
        this.end_n = n - 1;
        this.data = new Float32Array(m * n);
    }

    /**
     * Function which turns a x,y coordinate into one number which 
     * can be used to find the idx in the flat this.data array.
     *
     * @param {Number} x
     * @param {Number} y
     * @returns
     * @memberof ParameterMatrix
     */
    idx(x, y) {
        x = x - this.begin_m;
        y = y - this.begin_n;
        return x * this.n + y;
    }

    /**
     * Gives each element of this parameter matrix a random value between -1 and 1.
     *
     * @memberof ParameterMatrix
     */
    randomize() {
        for(let idx_m = 0; idx_m < this.m; idx_m++) {
            for(let idx_n = 0; idx_n < this.n; idx_n++) {
                this.data[this.idx(idx_m, idx_n)] = (Math.random() - 0.5) * 2.0;
            }
        }
    }

    /**
     * Sets the value at location x, y to value val.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} val
     * @memberof ParameterMatrix
     */
    add(x, y, val) {
        this.data[this.idx(x, y)] = val;
    }

    /**
     * Sets the value at location x, y to value val.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} val
     * @memberof ParameterMatrix
     */
    update(x, y, val) {
        this.data[this.idx(x, y)] = val;
    }

    /**
     * Sets row x to contain values from array vals.
     *
     * @param {Number} x
     * @param {Array} vals
     * @memberof ParameterMatrix
     */
    updateRow(x, vals) {
        vals.map((value, key) => {
            this.data[this.idx(x, key)] = value;
        });
    }

    /**
     * Uses another parameter matrix to update the values of this parameter matrix.
     * Takes the begin_m and begin_n into account.
     *
     * @param {ParameterMatrix} updatedVals
     * @memberof ParameterMatrix
     */
    updateSubset(updatedVals) {
        for(let idx1 = 0; idx1 < updatedVals.m; idx1++) {
            for(let idx2 = 0; idx2 < updatedVals.n; idx2++) {
                let x = idx1 + updatedVals.begin_m;
                let y = idx2 + updatedVals.begin_n;
                this.data[this.idx(x, y)] = updatedVals.data[updatedVals.idx(x, y)];
            }
        }
    }

    /**
     * Gets the value at location x, y
     *
     * @param {Number} x
     * @param {Number} y
     * @returns {Number}
     * @memberof ParameterMatrix
     */
    get(x, y) {
        return this.data[this.idx(x, y)];
    }

    /**
     * Gets the values in row m.
     *
     * @param {Number} m
     * @returns {Array}
     * @memberof ParameterMatrix
     */
    getRow(m) {
        let idx = this.idx(m, 0);
        return this.data.slice(idx, idx + this.n);
    }

    /**
     * Gets the values in column n
     *
     * @param {Number} n
     * @returns {Array}
     * @memberof ParameterMatrix
     */
    getColumn(n) {
        let data = new Float32Array(this.m);
        for(let idx = 0; idx < this.m; idx++) {
            data[idx] = this.get(idx, n);
        }
        return data;
    }

    /**
     * Gets multiple rows, from m to n
     *
     * @param {Number} m
     * @param {Number} n
     * @returns {ParameterMatrix}
     * @memberof ParameterMatrix
     */
    getRows(m, n) {
        let idx_m = this.idx(m, 0);
        let idx_n = this.idx(n + 1, 0);
        let rows = new ParameterMatrix(n + 1 - m, this.n);
        rows.data = this.data.slice(idx_m, idx_n);
        rows.begin_m = m;
        rows.end_m = n;

        return rows;
    }

    /**
     * Returns the amount of elements in the parameter matrix.
     *
     * @returns {Number}
     * @memberof ParameterMatrix
     */
    size() {
        return this.data.length;
    }

    /**
     * Parses an object back to a ParameterMatrix. Necessary, as serializing
     * and parsing a ParameterMatrix using WebSockets makes Javascript
     * forget what kind of object it used to be.
     *
     * @static
     * @param {Object} serializedParameterMatrix
     * @returns {ParameterMatrix}
     * @memberof ParameterMatrix
     */
    static parse(serializedParameterMatrix) {
        let paramMatrix = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(serializedParameterMatrix));
        paramMatrix.data = new Float32Array(Object.values(serializedParameterMatrix.data));
        return paramMatrix;
    }
}

module.exports = ParameterMatrix;
