"use strict";

/**
 * An array implementation that always stays sorted
 */
class SortedArray{
  constructor(){
    this.arr = [];
  }

  *generator(){
    for(var i in this.arr){
      yield this.arr[i];
    }
  }

  add(val){
    const index = this._binarySearch(val);
    this.arr.splice(index,0,val);
  }

  remove(val){
    const index = this._binarySearch(val);
    if(this.arr[index] === val){
      this.arr.splice(index, 1);
    }
  }

  has(val){
    const index = this._binarySearch(val);
    return this.arr[index] === val;
  }

  _binarySearch(val){
    let low = 0,
    high = this.arr.length;
    while (low < high) {
        let mid = (low + high) >>> 1;
        if (this.arr[mid] < val) low = mid + 1;
        else high = mid;
    }
    return low;
  }
}

module.exports = SortedArray;