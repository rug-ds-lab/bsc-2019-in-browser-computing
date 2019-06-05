
class SparseDistArray {
    constructor(dim) {
        // Elements of this distarray are n dimensional and are indexed with a N-tuple (using JS dicts)
        // Currently dim is always 2.
        this.data = {};
        this.dim = dim;
    }

    randomize(m, n) {
        for(let idx_m = 0; idx_m < m; idx_m++) {
            this.data[idx_m] = {};

            for(let idx_n = 0; idx_n < n; idx_n++) {
                this.data[idx_m][idx_n] = Math.random();
            }
        }
    }

    add(m, n, val) {
        if(!(m in this.data)) {
            this.data[m] = {};
        }
        this.data[m][n] = val;
    }

    update(m, n, val) {
        this.data[m][n] = val;
    }

    updateRow(m, vals) {
        for(let idx_n = 0; idx_n < vals.length; idx_n++) {
            this.data[m][idx_n] = vals[idx_n];
        }
    }

    updateSubset(updatedVals) {
        let outer_level = Object.keys(updatedVals['data']);
        for(let idx = 0; idx < outer_level.length; idx++) {
           this.data[outer_level[idx]] = updatedVals['data'][outer_level[idx]];
        }
    }

    get(m, n) {
        return this.data[m][n];
    }

    getRow(m) {
        return this.data[m];
    }

    getSubset(dim_ranges) {
        // Function to select a subset of a distarray.
        // Input should be an array with dim elements containing arrays of 2 elements.
        // Outer array is for the dimension, inner one for the range
        // Currently only for 2 dims.

        let beginDim1 = dim_ranges[0][0];
        let endDim1 = dim_ranges[0][1];
        let beginDim2 = dim_ranges[1][0];
        let endDim2 = dim_ranges[1][1];

        let newSDA = new SparseDistArray(2);
        for(let idx1 = beginDim1; idx1 <= endDim1; idx1++) {
            for(let idx2 = beginDim2; idx2 <= endDim2; idx2++) {
                if(this.data[idx1][idx2]) {
                    newSDA.add(idx1, idx2, this.data[idx1][idx2]);
                }
            }
        }
        return newSDA;
    }

    size() {
        let upper_level = Object.keys(this.data);
        let size = 0;
        for(let idx = 0; idx < upper_level.length; idx++) {
            size += Object.keys(this.data[upper_level[idx]]).length;
        }
        return size;
    }
}

module.exports = SparseDistArray;
// export default SparseDistArray;