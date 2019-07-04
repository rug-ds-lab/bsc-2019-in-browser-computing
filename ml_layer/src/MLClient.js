

import Client from 'distributed-stream/src/client/Client';
import socketio from 'socket.io-client';
const socket = socketio.connect("localhost:3000");

new Client({
    socket: socket,
    debug: true,
    workFile: "webworker.js"
});

socket.on("counter", (data) => {
  console.log(data);
});

socket.on("finish", () => { console.log("Finished.") });