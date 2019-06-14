
class Utils {
    static dot(arr1, arr2) {
        return arr1.reduce((r,a,i) => {return r+a*arr2[i]},0);
    }

    static dotDicts(arr1d, arr2d) {
        let arr1 = Object.values(arr1d);
        let arr2 = Object.values(arr2d);

        return arr1.reduce((r,a,i) => {return r+a*arr2[i]},0);
    }

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

    static groupBy(list, props) {
        return list.reduce((a, b) => {
           (a[b[props]] = a[b[props]] || []).push(b);
           return a;
        }, {});
      }
}

module.exports = Utils;