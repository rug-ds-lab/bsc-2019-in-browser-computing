const testingLatency = () => {
    if (window.Worker) {
        //Create the service worker
        const worker = new Worker('./worker.js');
        let totalTime = 0, 
            trips = 0;
        const size = 100;
        let startingTimeMilis = Date.now();
        //Send first message to thread
        worker.postMessage({
            time: startingTimeMilis,
            size,
        });
        //Handler for receiving messages
        worker.onmessage = ({ data }) => {
            const endingTimeMilis = Date.now();
            trips++;
            if (data === 'terminate') {
                worker.terminate();
                console.log('Worker Terminated');
                console.log('TotalTime: ' + (totalTime / 1000) + ' (sec)');
                console.log('Latency: ' + (totalTime / trips) + ' (ms)');
            } else {
                const elapsedTimeMilis = endingTimeMilis - data.time;
                totalTime += elapsedTimeMilis;
                // console.log(elapsedTimeMilis);
                startingTimeMilis = Date.now();
                worker.postMessage({
                    time: startingTimeMilis,
                    size: data.size - 1,
                });
            }
        }
    } else {
        console.log('Browser does not support web workers.');
    }
};

const serviceWorkerTests = {
    testingLatency,
};

Object.keys(serviceWorkerTests).forEach((test) => {
    serviceWorkerTests[test]();
});
