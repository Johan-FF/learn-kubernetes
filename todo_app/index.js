'use strict';

const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('todo app\n');
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
