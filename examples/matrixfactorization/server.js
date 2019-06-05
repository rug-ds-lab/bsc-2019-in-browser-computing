const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path'),
  socketio = require('socket.io'),
  ParameterStream = require('./ParameterStream.js');

// Set up a basic server serving a single page
const express = require('express')
const app = express()
const port = 3000;

const httpServer = app.listen(port);

app.use(express.static(path.join(__dirname, '../../')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Create a ParameterStream:
// Works roughly like this currently:
// (updated parameters) -> paramStream -> (computationJobs) -> DistributedStream -> (updated parameters) -> paramStream
const paramStream = new ParameterStream();
const distributedStream = new DistributedStream({redundancy:1, socket: socketio(httpServer)});

// Connect the stream to eachother
paramStream.pipe(distributedStream).pipe(paramStream);

// Start the algorithm by sending something to the paramStream
// paramStream.write("{}");
