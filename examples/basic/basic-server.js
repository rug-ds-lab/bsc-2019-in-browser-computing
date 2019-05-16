const DistributedStream = require('../../src/DistributedStream'),
  es = require('event-stream'),
  path = require('path');

// Set up a basic server serving a single page
const express = require('express')
const app = express()
const port = 3000;

app.use(express.static(path.join(__dirname, '../../')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
const httpServer = app.listen(port, () => console.log(`Listening on ${port}!`));

// Stream constructed from a function that simply counts from 0 till 5000
const numberStream = es.readable(function(i, callback)  {
  if(i > 5000){
    return this.emit('end')
  }
  return callback(null, i.toString());
});

const distributedStream = new DistributedStream({redundancy:2, httpServer});

numberStream.pipe(distributedStream).pipe(es.stringify()).pipe(process.stdout);
