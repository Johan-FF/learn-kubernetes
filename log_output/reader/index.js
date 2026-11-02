'use strict';

const fs = require('fs');
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const LOG_FILE = process.env.LOG_FILE || '/usr/src/app/files/output.txt';

const server = http.createServer((req, res) => {
  let content;
  try {
    content = fs.readFileSync(LOG_FILE, 'utf8');
  } catch {
    content = 'waiting for the writer to create the file\n';
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}, reading ${LOG_FILE}`);
});
