class Data{
  constructor(data, order){
    this.data = data;
    this.order = order;

    this.results = []; // objects with data, count keys
    this.clientsProcessed = []; // clients that processed this data
    this.majorityCount = 0;
    this.totalCount = 0;
    this.currentProcessorCount = 0; //number of nodes currently processing this data piece
  }

  // should be sent if (assuming all current processors return correctly), majority would 
  // still not have enough difference over the rest 
  shouldBeSent(redundancy){
    return redundancy > this.currentProcessorCount + (2*this.totalCount - this.majorityCount);
  }

  doneWithProcessing(redundancy){
    return (2*this.totalCount - this.majorityCount) >= redundancy;
  }
  
  //add result, update the counts
  addResult(result, client, equalityFunction){
    this.clientsProcessed.push(client.id);

    let res = this.results.find((el) => equalityFunction(el.data, result));
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

  processedByClient(client){
    return this.clientsProcessed.includes(client.id);
  }
}

module.exports = Data;