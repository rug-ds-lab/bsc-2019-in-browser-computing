class Data{
  constructor(data, order){
    this.data = data;
    this.order = order;

    this.results = []; // objects with data, count keys
    this.clientsProcessed = []; // clients that processed this data
    this.majorityCount = 0;
    this.runnerUpCount = 0;
    this.currentProcessorCount = 0; //number of nodes currently processing this data piece
  }

  // determines if this data piece should still be sent to clients
  shouldBeSent(redundancy){
    return redundancy > this.currentProcessorCount + (this.majorityCount - this.runnerUpCount);
  }

  doneWithProcessing(redundancy){
    return !this.currentProcessorCount && (this.majorityCount - this.runnerUpCount) >= redundancy;
  }
  
  //add result, update counts
  addResult(result, client, equalityFunction){
    this.clientsProcessed.push(client.id);
    if((res = this.results.find((el) => equalityFunction(el.data, result)))){
      res.count++;
    } else {
      this.result.push({data:result, count:1});
    }
    //update counts
    const that = this;
    this.results.forEach((el) => {
      if(el.count > that.majorityCount){
        that.majorityCount = el.count;
      } else if(el.count > that.runnerUpCount) {
        that.runnerUpCount = el.count;
      }
    });
  }
}

module.exports = Data;