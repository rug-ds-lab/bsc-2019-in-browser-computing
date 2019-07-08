let distances;

const calculateDistance = (permutation) => {
  let lastCity;
  let distance = 0;

  for(city of permutation){
    if(lastCity === undefined){
      lastCity = city;
      continue;
    }

    distance += distances[city][lastCity];
  }

  return {distance, permutation};
}

self.onmessage = (e) => {
  if(e.data.initialData){
    distances = e.data.initialData;
    return;
  }

  // otherwise a permutation of citiesc
  postMessage(e.data.map(calculateDistance))
};