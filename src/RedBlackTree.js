"use strict";

const tree = require('bintrees').RBTree;

/**
 * A Red Black Tree.
 */
class RedBlackTree{
  constructor(){
    this._tree = new tree((a, b) => a - b);
  }

  /**
   * Provides a generator which goes over all the items in the tree.
   */
  *generator(){
    const it = this._tree.iterator();
    let i;
    while((i = it.next()) !== null) {
        yield i;
    }
  }

  /**
   * Add the value to the tree
   * @param {any} val 
   */
  add(val){
    this._tree.insert(val);
  }

  /**
   * Remove the value from the tree
   * @param {any} val 
   */
  remove(val){
    this._tree.remove(val);
  }

  /**
   * Return whether the tree has the value
   * @param {any} val 
   * @returns {Boolean}
   */
  has(val){
    return this._tree.find(val) !== null;
  }
}

module.exports = RedBlackTree;