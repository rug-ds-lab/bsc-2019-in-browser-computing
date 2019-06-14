
class SparseDistArray {
    constructor() {
        this.data = new Map();
    }

    add(m, n, val) {
        this.data.set([m, n].toString(), val);
    }

    get(m, n) {
        return this.data.get([m, n].toString());
    }

    size() {
        return this.data.size;
    }
}

module.exports = SparseDistArray;
