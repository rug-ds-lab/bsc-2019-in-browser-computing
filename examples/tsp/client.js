new Client({
    socket: io("server-service:3000"),
    debug: true,
    workFile: "/examples/tsp/worker.js"
});
