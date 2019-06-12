class Data{
  constructor({data, order, redundancy}){
    this.data = data;
    this.order = order;
    this.redundancy = redundancy;

    this.results = []; // objects with data, count keys
    this.voters = []; // clients that are processing/processed this data
    this.majorityCount = 0;
    this.totalCount = 0;
    this.currentProcessorCount = 0; //number of nodes currently processing this data piece
  }

  // should be sent if (assuming all current processors return correctly), majority would 
  // still not have enough difference over the rest 
  shouldBeSent(){
    return this.redundancy > this.currentProcessorCount + (2*this.totalCount - this.majorityCount);
  }

  doneWithProcessing(){
    return (2*this.totalCount - this.majorityCount) >= this.redundancy;
  }

  addVoter(client){
    this.voters.push(client);
    this.currentProcessorCount++;
  }

  removeVoter(client){
    this.voters = this.voters.filter(el => el.id !== client.id);
    this.currentProcessorCount--;
  }

  canVote(client){
    return this.shouldBeSent() && !this.voters.find(el => el.id === client.id);
  }

  getMajorityResult(){
    return this.results.reduce((acc, cur) => acc.count > cur.count ? acc : cur, {}).data;
  }

  addResult(result){
    this.currentProcessorCount--;

    let res = this.results.find((el) => JSON.stringify(el.data) === JSON.stringify(result));
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