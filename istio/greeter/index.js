'use strict';

const http = require('http');

const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    console.error(`missing required environment variable ${name}`);
    process.exit(1);
  }

  return value;
};

const PORT = Number(required('PORT'));
const VERSION = required('GREETER_VERSION');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok\n');
    return;
  }

  console.log(`${VERSION} handled ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`hello from ${VERSION}\n`);
});

server.listen(PORT, () => {
  console.log(`greeter ${VERSION} started in port ${PORT}`);
});
