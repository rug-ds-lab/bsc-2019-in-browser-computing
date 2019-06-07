
class ParameterMatrix {
    constructor(m, n) {
        this.m = m;
        this.n = n;
        this.begin_m = 0;
        this.end_m = m - 1;
        this.begin_n = 0;
        this.end_n = n - 1;
        this.data = new Float32Array(m * n);
    }

    idx(x, y) {
        // x = x % this.m;
        // y = y % this.n;
        x = x - this.begin_m;
        y = y - this.begin_n;
        return x * this.n + y;
    }

    randomize() {
        for(let idx_m = 0; idx_m < this.m; idx_m++) {
            for(let idx_n = 0; idx_n < this.n; idx_n++) {
                this.data[this.idx(idx_m, idx_n)] = Math.random();
            }
        }
    }

    add(x, y, val) {
        this.data[this.idx(x, y)] = val;
    }

    update(x, y, val) {
        this.data[this.idx(x, y)] = val;
    }

    updateRow(x, vals) {
        vals.map((value, key) => {
            this.data[this.idx(x, key)] = value;
        });
    }

    updateSubset(updatedVals, m, n, p, q) {
        // console.log(updatedVals);
        for(let idx1 = m; idx1 < n; idx1++) {
            for(let idx2 = p; idx2 < q; idx2++) {
                // console.log(idx1, m, idx2, n);
                // console.log(updatedVals.data[this.idx(idx1 - m, idx2 - p)]);
                this.data[this.idx(idx1, idx2)] = updatedVals.data[this.idx(idx1 - m, idx2 - p)];
            }
        }
    }

    get(x, y) {
        return this.data[this.idx(x, y)];
    }

    getRow(m) {
        // console.log("Getting row");

        let idx = this.idx(m, 0);
        // console.log(this.data);
        // console.log("GetRow with", m, " idx becomes:", idx);
        // console.log(idx);
        return this.data.slice(idx, idx + this.n);
    }

    getRows(m, n) {
        let idx_m = this.idx(m, 0);
        let idx_n = this.idx(n + 1, 0);
        // console.log("Slicing", idx_m, idx_n);
        let rows = new ParameterMatrix(n + 1 - m, this.n);
        rows.data = this.data.slice(idx_m, idx_n);
        rows.begin_m = m;
        rows.end_m = n;

        return rows;
    }

    size() {
        return this.data.length;
    }
}

module.exports = ParameterMatrix;
// export default SparseDistArray;