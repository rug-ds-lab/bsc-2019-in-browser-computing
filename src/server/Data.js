class Data{
  constructor({data, order, redundancy}){
    /** Underlying data */
    this.data = data;
    /** The order in which this data piece was read from the stream */
    this.order = order;
    /** The Redundancy factor */
    this.redundancy = redundancy;

    /** Received result. Objects with data (the actual received result) 
     * and count (how many times this exact result was received) keys */
    this.results = []; 
    /** IDs of clients that are processing/has processed this data */
    this.voters = [];
    /** How many votes the majority result received */
    this.majorityCount = 0;
    /** Total number of votes */
    this.totalCount = 0;
    /** Number of nodes currently processing this data piece */
    this.currentProcessorCount = 0;
  }

  /**
   * Returns whether this data piece should still be sent to the clients. Beware that 
   * even if this function returns false once, it can still return true in the future if 
   * a processing worker returns a faulty result.
   * 
   * Data should be sent if assuming all current processors return correctly, 
   * majority would still not satisfy the redundancy factor.
   * @returns {Boolean}
   */
  shouldBeSent(){
    return this.redundancy > this.currentProcessorCount + (2*this.totalCount - this.majorityCount);
  }

  /**
   * Returns whether this data piece has a majority opinion which can be accepted.
   * @returns {Boolean}
   */
  doneWithProcessing(){
    const others = this.totalCount - this.majorityCount;
    const diff = this.majorityCount - others;

    return diff >= this.redundancy;
  }

  /**
   * Register the given client as a voter
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  addVoter(client){
    this.voters.push(client.id);
    this.currentProcessorCount++;
  }

  /**
   * Remove the given client from the voters list
   * 
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   */
  removeVoter(client){
    this.voters = this.voters.filter(voter => voter !== client.id);
    this.currentProcessorCount--;
  }

  /**
   * Returns whether the given client can vote on this data piece. A client can vote
   * on a data piece if the data piece should still be sent to more clients, and this
   * client hasn't voted on it before.
   * @param {Socket} client See https://socket.io/docs/server-api/#Socket
   * @returns {Boolean}
   */
  canVote(client){
    return this.shouldBeSent() && !this.voters.find(voter => voter === client.id);
  }

  /**
   * Determines and returns the majority result for this data piece.
   * 
   * @returns {any} The result
   */
  getMajorityResult(){
    return this.results.reduce((acc, cur) => acc.count > cur.count ? acc : cur, {}).data;
  }

  /**
   * Registers the given result for this data piece.
   * 
   * @param {any} result 
   */
  addResult(result){
    this.currentProcessorCount--;

    const res = this.results.find((el) => JSON.stringify(el.data) === JSON.stringify(result));
    if(res){
      res.count++;
    } else {
      this.results.push({data:result, count:1});
    }

    const val = (res ? res.count : 1);
    if(val > this.majorityCount){
      this.majorityCount = val;
    }
    this.totalCount++;
  }

}

module.exports = Data;