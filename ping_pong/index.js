'use strict';

const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

// The counter lives in memory, so it is shared by every request handled by this process.
let counter = 0;

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed\n');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`pong ${counter}\n`);
  counter += 1;
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
