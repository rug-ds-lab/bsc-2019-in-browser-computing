self.importScripts("wasm.js");

import ParameterMatrix from './ParameterMatrix';
import {work_function, use_wasm} from '../examples/matrixfactorization/MatrixFactorization';

/**
   * The clients receive multiple chunks of data when the amount of chunks > the amount of workers. 
   * This function processes one of these chunks.
   *
   * @param chunk A chunk of data to be processed.
   */
const processChunk = (chunk) => {

  let training_data = initialData.data[chunk.partitionIdx.toString()];

  let parameters = {};
  for(const [key, value] of Object.entries(chunk.parameters)) {
    parameters[key] = ParameterMatrix.parse(value);
  }

  training_data.forEach((value, key) => work_function(key.split(',').map(Number), value, parameters, initialData.hyperparameters));

  let output = {};
  output.parameters = parameters;
  output.partitionIdx = chunk.partitionIdx;

  return output;
};

const copyTypedArray2CPPVec = (typedArray, vec) => {
  for (let idx = 0; idx < typedArray.length; idx++) {
      vec.push_back(typedArray[idx]);
  }
}

const copyCPPVec2TypedArray = (vec, typedArray) => {
  for (let idx = 0; idx < typedArray.length; idx++) {
      typedArray[idx] = vec.get(idx);
  }
}

const copyMap2CPPMap = (map, cppMap) => {
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
  let training_data = initialData.data[chunk.partitionIdx.toString()];

  let learningRate = initialData.hyperparameters.get('learningRate');
  let beta = initialData.hyperparameters.get('beta');
  let featureCount = initialData.hyperparameters.get('featureCount');

  let W = ParameterMatrix.parse(chunk.parameters.W);
  let H = ParameterMatrix.parse(chunk.parameters.H);

  let vecW = Module.returnVector();
  let vecH = Module.returnVector();

  copyTypedArray2CPPVec(W.data, vecW);
  copyTypedArray2CPPVec(H.data, vecH);

  training_data.forEach((value, key) => Module.computeUpdate(key, value, vecW, vecH, W.m, W.begin_m, H.m, H.begin_m, featureCount, learningRate, beta));

  copyCPPVec2TypedArray(vecW, W.data);
  copyCPPVec2TypedArray(vecH, H.data);

  let output = {};
  output.parameters = {};
  output.parameters.W = W;
  output.parameters.H = H;
  output.partitionIdx = chunk.partitionIdx;

  return output;
};

let initialData = {};

// The server sends messages to this message handler.
self.onmessage = (event) => {
  if(event.data.initialData) {
    initialData.hyperparameters = new Map(event.data.initialData.hyperparameters);
    let dataPartitions = event.data.initialData.data;
    Object.keys(dataPartitions).map((x) => dataPartitions[x] = new Map(dataPartitions[x]));
    initialData.data = dataPartitions;
    return;
  }
  if(use_wasm) {
    Module.ready.then(() => {
      console.time('computeUpdatesWasmTotal');
      postMessage(event.data.map(processChunkWasm))
      console.timeEnd('computeUpdatesWasmTotal');
    });
  } else {
    console.time('computeUpdatesJSTotal');
    postMessage(event.data.map(processChunk))
    console.timeEnd('computeUpdatesJSTotal');
  }
};