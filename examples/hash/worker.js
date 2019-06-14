self.importScripts("sha256.js");

self.onmessage = (event) => {
  Module.ready.then(() => {
    postMessage(event.data.map((d) => Module.sha256(d)))
  });
}