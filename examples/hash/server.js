const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path'),
  socketio = require('socket.io'),
  fs = require('fs'),
  express = require('express');

// Set up a basic server serving a single page
const app = express()

const socket = socketio(app.listen(3000));

app.use(express.static(path.join(__dirname, '../../')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const distributedStream = new DistributedStream({socket});

// Read from the file line by line, direct into the distributed stream, print
fs.createReadStream(path.join(__dirname, 'password_list.txt'))
  .pipe(es.split())
  .pipe(distributedStream)
  .pipe(es.stringify())
  .pipe(process.stdout);
