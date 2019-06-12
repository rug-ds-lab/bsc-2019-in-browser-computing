self.importScripts("/dist/distributed_stream_SparseDistArray.js");
self.importScripts("/dist/distributed_stream_Utils.js");
self.importScripts("/dist/distributed_stream_ParameterMatrix.js");
self.importScripts("mf_wasm.js");

const loop_body = (e_idx, e_val, W, H, learningRate, beta, featureCount) => {
  let user = e_idx[0];
  let movie = e_idx[1];
  let rating = e_val;

  let predictedRating = Utils.dotDicts(H.getRow(movie), W.getRow(user));
  let error = rating - predictedRating;

  // Iterate over features
  for(let idx_f = 0; idx_f < featureCount; idx_f++) {
      let updatedW = W.get(user, idx_f) +
          learningRate * (2 * error * H.get(movie, idx_f) - beta * W.get(user, idx_f));
      W.update(user, idx_f, updatedW);

      let updatedH = H.get(movie, idx_f) +
          learningRate * (2 * error * W.get(user, idx_f) - beta * H.get(movie, idx_f));
      H.update(movie, idx_f, updatedH);
  }
}

/**
   * The clients receive multiple chunks of data when the amount of chunks > the amount of workers. This function processes one of these chunks.
   *
   * @param chunk A chunk of data to be processed.
   */
const processChunk = (chunk) => {
  /**
   * SGD Matrix factorization loop body.
   * This function calculates the updates on the parameters in W and H based on one data row.
   * TODO: Currently still has hardcoded hyperparameters. This needs to be fixed.
   * @param e_idx is are the indices of the SparseDistArray (So [user][movie])
   * @param e_val is the value of the corresponding index. So for the MF situation it is the rating the user gave to the movie.
   * @param W Parameters in W (These needs to be globally accesible in the environment of the loop body? So the only parameters are e_idx and e_val)
   * @param H Parameters in H
   */

  let training_data = new Map(chunk.data_partition);
  let params = chunk.param_partitions;
  let learningRate = chunk.hyperparameters.learningRate;
  let featureCount = chunk.hyperparameters.featureCount;
  let beta = chunk.hyperparameters.beta;


  let W = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(params.W_partition));
  W.data = new Float32Array(Object.values(params.W_partition.data));

  let H = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(params.H_partition));
  H.data = new Float32Array(Object.values(params.H_partition.data));


  // Iterate over all the data. (using a double for loop, because of the dict data structure.)
  // Ideally, the system would be able to do this by itself, so the user only needs to provide the "loop_body" function.
  console.time('computeUpdatesJS');
  training_data.forEach((value, key) => loop_body(key.split(',').map(Number), value, W, H, learningRate, beta, featureCount));
  console.timeEnd('computeUpdatesJS');

  let output = {};
  output.W_partition = W;
  output.H_partition = H;
  output.partition = chunk.partition;

  return output;
};

copyTypedArray2CPPVec = (typedArray, vec) => {
  for (let idx = 0; idx < typedArray.length; idx++) {
      vec.push_back(typedArray[idx]);
  }
}

copyCPPVec2TypedArray = (vec, typedArray) => {
  for (let idx = 0; idx < typedArray.length; idx++) {
      typedArray[idx] = vec.get(idx);
  }
}

copyMap2CPPMap = (map, cppMap) => {
  map.forEach((value, key) => {
      cppMap.set(key, value);
  });
}

/**
* Work function the clients use for calculating updates for the matrix factorization.
*
* @param raw Is the raw string received from the DistributedStream.
*/
const processChunkWasm = (chunk) => {
  let training_data = new Map(chunk.data_partition);
  let params = chunk.param_partitions;
  let learningRate = chunk.hyperparameters.learningRate;
  let featureCount = chunk.hyperparameters.featureCount;
  let beta = chunk.hyperparameters.beta;

  let W = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(params.W_partition));
  W.data = new Float32Array(Object.values(params.W_partition.data));

  let H = Object.create(ParameterMatrix.prototype, Object.getOwnPropertyDescriptors(params.H_partition));
  H.data = new Float32Array(Object.values(params.H_partition.data));

  let vecW = Module.returnVector();
  let vecH = Module.returnVector();
  let mapData = Module.returnMapData();

  copyTypedArray2CPPVec(W.data, vecW);
  copyTypedArray2CPPVec(H.data, vecH);
  copyMap2CPPMap(training_data, mapData);

  console.time('computeUpdatesWasm');
  Module.computeUpdates(mapData, vecW, vecH, W.m, W.begin_m, H.m, H.begin_m, featureCount, learningRate, beta);
  console.timeEnd('computeUpdatesWasm');

  copyCPPVec2TypedArray(vecW, W.data);
  copyCPPVec2TypedArray(vecH, H.data);

  let output = {};
  output.W_partition = W;
  output.H_partition = H;
  output.partition = chunk.partition;

  return output;
};


self.onmessage = (event) => {
  Module.ready.then(() => postMessage(event.data.map(processChunkWasm)));
  // postMessage(event.data.map(processChunk));
};