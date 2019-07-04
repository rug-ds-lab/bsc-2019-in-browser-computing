import path from 'path';
import socketio from 'socket.io';
import {partition, initialData, guard, parameters, hyperparameters} from './MatrixFactorization';
import DistributedStreamML from '../../src/DistributedStreamML';

// Set up a basic server serving a single page
const express = require('express')
const app = express()
const port = 3000;
const httpServer = app.listen(port);

app.use(express.static(path.join(__dirname, '/')))
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const socket = socketio(httpServer, { serveClient: false });
const distributedStreamML = new DistributedStreamML({socket, partition, guard, initialData, parameters, hyperparameters});

distributedStreamML.start();
