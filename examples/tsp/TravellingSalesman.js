class TravellingSalesman{
  constructor(cityCount){
    this.cityCount = cityCount;
    this.distances = this.generateRandomDistance();
    this.generator = this._permutationGenerator();
  }

  // generates distances between each pair of cities
  generateRandomDistance(){
    const distances = {};
    for(let i=1;i<=this.cityCount;i++){
      distances[i] = {};
    }

    for(let i=1;i<=this.cityCount;i++){
      for(let j=1;j<=this.cityCount;j++){
        if(i===j) continue;
        if(distances[j][i] !== undefined){
          distances[i][j] = distances[j][i];
        } else {
          distances[i][j] = Math.ceil(1000 * Math.random());
          distances[j][i] = distances[i][j];
        }
      }
    }
    return distances;
  }

  *_permutationGenerator(){
    const arr = Array.from(Array(this.cityCount)).map((e,i)=>i+1);
    let c = Array(this.cityCount).fill(0),
        i = 1, k, p;
  
    yield arr.slice();
    while (i < this.cityCount) {
      if (c[i] < i) {
        k = i % 2 && c[i];
        p = arr[i];
        arr[i] = arr[k];
        arr[k] = p;
        ++c[i];
        i = 1;
        yield arr.slice();
      } else {
        c[i] = 0;
        ++i;
      }
    }
  }
}

module.exports = TravellingSalesman;