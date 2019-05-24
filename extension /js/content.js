{/* <script src="../../dist/client.js"></script>
    <script src="./basic-client.js"></script> */}

const injectElementsToHeader = (paths) => {
    const head = document.head || document.getElementsByTagName("head");

    paths.forEach((path) => {
        const scriptElement = document.createElement('script');
        scriptElement.setAttribute("type", "text/javascript");
        scriptElement.setAttribute("async", true);
        scriptElement.setAttribute("src", path);
        head.appendChild(scriptElement);
    });
};

chrome.runtime.onMessage.addListener((isChecked) => {
    // const Client = require('../../src/client/BundledClient.js');

    // const findPrimeFactors = (num, callback) => {
    //     let factors = [];

    //     for (let i = 2; i <= num; i++) {
    //         while ((num % i) === 0) {
    //             factors.push(i);
    //             num /= i;
    //         }
    //     }

    //     return callback(null, factors);
    // };

    // if(isChecked) {
    //     console.log('Loading Client...');
    //     new Client({
    //         host: "http://localhost:",
    //         port: 3000,
    //         debug: true,
    //         workFunction: findPrimeFactors,
    //     }).connect();
    // } else {
    //     console.log('Unloading Client...');
        
    // }
    if(isChecked) {
        injectElementsToHeader(['https://cors-anywhere.herokuapp.com/https://cdnjs.com/libraries/require.js/',
            '../../dist/client.js',
            '../../examples/basic/basic-client.js']);
    }
});
