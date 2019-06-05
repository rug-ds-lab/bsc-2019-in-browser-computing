[![Build Status](https://travis-ci.com/rug-ds-lab/bsc-2019-in-browser-computing.svg?token=d8egmRZqbNmvN2XPH4z3&branch=master)](https://travis-ci.com/rug-ds-lab/bsc-2019-in-browser-computing)

# Distributed Stream
Under construction

## Get Started
The Distributed Stream works on top of Node.js. To run the packed and minified production code, download the files from the `dist/` folder. Alternatively, the back-end code can be downloaded via npm: `npm i --save distributed_stream` [TO BE DONE].

The stream code needs a http server to attach to, thus it can be used alongside an arbitrary Express server. A basic example that reads data from an object, distributes it to workers, streams out the results as soon as they are calculated.
```
const app = require('express')(),
  socketio = require('socket.io),
  DistributedStream = require('distributed_stream');

// Set up a basic server serving a single html page, 
// initialize the stream to use the server
app.get('/', (req, res) => res.sendFile('index.html'));
const distributedStream = new DistributedStream({socket: socketio(app.listen(3000)));

// Pipe an input stream in, and pipe the results out
inputStream.pipe(distributedStream).pipe(outputStream);
```

The client code is even simpler. When the Client is initialized, it needs to be given the work function, which is going to be called with all the received data pieces as well as server information.

A simple `index.html` could be:
```
<html>
  <body>
    <script src="distributed_stream_client.js"></script>
    <script>
        const doWork = (dataPiece) => {
            // do some work here
            return processedDataPiece;
        };

        new Client({
            host: "localhost",
            port: 3000,
            workFunction: doWork,
        }).connect();
    </script>
  </body>
</html>
```
The server distributing the work doesn't need to be the same server serving the webpage. Any CORS enabled domain is possible!

## Developer Manual