[![Build Status](https://travis-ci.com/rug-ds-lab/bsc-2019-in-browser-computing.svg?token=d8egmRZqbNmvN2XPH4z3&branch=master)](https://travis-ci.com/rug-ds-lab/bsc-2019-in-browser-computing)

# Distributed In-Browser Computing
This project was developed as a Bachelor's Thesis by George Argyrousis and Tolga Parlan, students of Computing Science at University of Groningen. It is also distributed as an npm package [IN FUTURE UPDATE]. Distributed In-Browser Computing allows you to distribute large computations to the clients who connect to your website. It is designed as a Node Duplex stream, where you can pipe the tasks in, and pipe the results out. The client code runs the calculations, in a seperate WebWorker thread.

## Getting Started
The Distributed Computing works on top of Node.js. To run the packed and minified production code, download the files from the `dist/` folder. Alternatively, the back-end code can be downloaded via npm: `npm i --save distributed_stream` [TO BE DONE].

The stream code needs a socket to attach to, thus it can be used alongside any arbitrary Node HTTP server (including Express). A basic example that reads data from an , distributes it to workers, streams out the results as soon as they are calculated.

```
const app = require('express')(),
  socketio = require('socket.io),
  DistributedStream = require('distributed_stream');

// Set up a basic server serving a single html page 
app.get('/', (req, res) => res.sendFile('index.html'));
const distributedStream = new DistributedStream({socket: socketio(app.listen(3000)));

// Pipe an input stream in, and pipe the results out
inputStream
  .pipe(distributedStream)
  .pipe(outputStream);
```

The client code is even simpler. When the Client is initialized, it needs to be provided the name of the WebWorker file, which is going to be fed with all the received data pieces.

A simple `index.html` could be:
```
<html>
  <body>
    <script src="distributed_stream_client.js"></script>
    <script src="socket-io.js"></script>
    <script>
        new Client({
            socket: io("http://website.com"), // initialize the socket with the server
            workFile: "/work.js",
        });
    </script>
  </body>
</html>
```

The file `work.js` will receive groups of data as a message. It should map the array of data pieces with whatever work needs to be done on each of them, and use the `postMessage` construct to send them back.

```
const workFunction = (dataPiece) => {...}

self.onmessage = (event) => {
  postMessage(event.data.map((d) => workFunction(d)));
}
```

## Options
Both the server and the client can be initialized with several options. They are listed below:

### Server
An object with the options:
* **Required** socket https://socket.io/docs/server-api/#Server
* **Optional** (Boolean) Defaults to [opt.debug=false] Debug mode. Prints actions as they are happening.
* **Optional** (Number) Defaults to [opt.highWaterMark=100] Maximum number of data batches to put into the stream at once.
* **Optional** (Number) Defaults to [opt.redundancy=1] Redundancy factor used for the voting algorithm. Defaults to no redundancy.
* **Optional** (Number) Defaults to [opt.port=3000] Effective only if no opt.httpServer is passed.
* **Optional** (Object) Defaults to [opt.distribution] The type of load distribution requested.
* **Optional** (String) Defaults to [opt.distribution.type="chunk"] The type of load distribution server should provide. Can be `adaptive`, `single` or `chunk` (default).
* **Optional** (Number) Defaults to [opt.distribution.size=1] Chunk sizes for the load distribution if chunk was selected as type.

### Client
An object with the options:

* **Required** String options.workFile
* **Optional** Boolean [options.debug=false] Debug mode
* **Optional** Number [options.reconnectInterval=5000] The time (in ms) to wait before trying to reconnect to the server.

## Development Tips
The server distributing the work doesn't need to be the same server serving the webpage. Any CORS enabled domain is possible. The client can simply be provided with any website to open a socket connection to. This can be used to construct a system that runs the same calculation on the clients of different domains for example.

Integration with WebAssembly is easy and can provide significant speedups. Check out the `hash` and `matrixfactorization` examples to see how it is done.

If all the clients need to work on one set of data, it might be a good idea to send all of it early on. We provide the `initialData` option on the server object for this. You can send any JS construct this way to the clients before any other calculation is ran, and access that piece of data in your WebWorker code. See the `tsp` example code.

## Ideal Jobs for Distribution
Ideal jobs for distributing over the network have relatively low data transfers to the clients, combined with intensive calculations. The more intensive the calculation compared to the data transfer, the more scalable your system is going to be. However beware of calculations that takes too much time, and may not finish before some clients leave your website. Chunk sizes can be tweaked to optimize this.


