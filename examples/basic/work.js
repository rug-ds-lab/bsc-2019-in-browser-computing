const findPrimeFactors = (num) => {
  let factors = [];

  for (let i = 2; i <= num; i++) {
      while ((num % i) === 0) {
          factors.push(i);
          num /= i;
      }
  }

  return factors;
};

self.onmessage = (e) => {
  postMessage(e.data.map(findPrimeFactors));
}