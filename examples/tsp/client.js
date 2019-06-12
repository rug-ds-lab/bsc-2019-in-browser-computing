new Client({
    socket: io("localhost:3000"),
    debug: true,
    workFile: "/examples/tsp/worker.js"
});
