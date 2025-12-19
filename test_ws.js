const WebSocket = require('ws');

// Note: standard URL is used. 
// If 'ws' module is not installed, we might need to install it. 
// But checking if 'ws' is available in the environment? 
// The user environment might not have 'ws' installed globally.
// We can use the 'frontend' container which definitely has node, but maybe not 'ws' package specifically? 
// The frontend uses 'vite', so it likely doesn't rely on 'ws' package for client since it uses native browser WebSocket.
// But we can try to install it locally or use a zero-dependency approach if possible?
// Implementing a websocket client in pure nodejs without deps is hard.

// Let's assume we can npm install ws.
console.log("Starting test script...");

const ws = new WebSocket('ws://localhost:8080/v1/users');

ws.on('open', function open() {
  console.log('connected');
  // Send empty JSON to trigger the streaming
  ws.send(JSON.stringify({}));
});

ws.on('message', function message(data) {
  console.log('received: %s', data);
});

ws.on('close', function close() {
  console.log('disconnected');
});

ws.on('error', function error(err) {
  console.error('error:', err);
});
