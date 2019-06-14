new Client({
    socket: io("localhost:3000"),
    debug: true,
    workFile: "/examples/hash/worker.js",
});
