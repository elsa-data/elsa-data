declare var self: Worker;

console.log("WORKER");

self.onmessage = (event: MessageEvent) => {
  console.log(event.data);
  postMessage("world");
};

(async () => {
  console.log("ASYNC CODE");
})();
