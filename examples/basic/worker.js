const findPrimeFactors = (data) => {
    const factors = [];
    
    data.forEach((num) => {
        const tempFactors = [];

        for (let j = 2; j <= num; j++) {
            while ((num % j) === 0) {
                tempFactors.push(j);
                num /= j;
            }
        }

        factors.push(tempFactors);
    });

    return factors;
};

self.onmessage = (e) => {
    postMessage(findPrimeFactors(e.data));
}
