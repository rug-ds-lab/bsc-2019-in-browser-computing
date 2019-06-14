
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
        x = x - this.begin_m;
        y = y - this.begin_n;
        return x * this.n + y;
    }

    randomize() {
        for(let idx_m = 0; idx_m < this.m; idx_m++) {
            for(let idx_n = 0; idx_n < this.n; idx_n++) {
                this.data[this.idx(idx_m, idx_n)] = (Math.random() - 0.5) * 2.0;
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

    updateSubset(updatedVals) {
        for(let idx1 = 0; idx1 < updatedVals.m; idx1++) {
            for(let idx2 = 0; idx2 < updatedVals.n; idx2++) {
                let x = idx1 + updatedVals.begin_m;
                let y = idx2 + updatedVals.begin_n;
                this.data[this.idx(x, y)] = updatedVals.data[updatedVals.idx(x, y)];
            }
        }
    }

    get(x, y) {
        return this.data[this.idx(x, y)];
    }

    getRow(m) {
        let idx = this.idx(m, 0);
        return this.data.slice(idx, idx + this.n);
    }

    getRows(m, n) {
        let idx_m = this.idx(m, 0);
        let idx_n = this.idx(n + 1, 0);
        let rows = new ParameterMatrix(n + 1 - m, this.n);
        rows.data = this.data.slice(idx_m, idx_n);
        rows.begin_m = m;
        rows.end_m = n;

        return rows;
    }

    size() {
        return this.data.length;
    }

    static parse(serializedParameterMatrix) {
        let paramMatrix = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(serializedParameterMatrix));
        paramMatrix.data = new Float32Array(Object.values(serializedParameterMatrix.data));
        return paramMatrix;
    }
}

module.exports = ParameterMatrix;
