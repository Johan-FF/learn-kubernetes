'use strict';

const http = require('http');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT) || 3000;

// Generated once at startup and kept in memory for the lifetime of the process.
const hash = randomUUID();

const print = () => {
  console.log(`${new Date().toISOString()}: ${hash}`);
};

print();
setInterval(print, 5000);

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`${new Date().toISOString()}: ${hash}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
