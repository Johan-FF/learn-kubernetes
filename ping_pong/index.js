'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const PING_FILE = process.env.PING_FILE || '/usr/src/app/data/pingpong.txt';

fs.mkdirSync(path.dirname(PING_FILE), { recursive: true });

// The counter survives restarts because it is read back from the shared volume.
let counter = 0;
try {
  const stored = Number(fs.readFileSync(PING_FILE, 'utf8').trim());
  if (Number.isFinite(stored)) {
    counter = stored;
  }
} catch {
  counter = 0;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed\n');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`pong ${counter}\n`);

  counter += 1;
  fs.writeFileSync(PING_FILE, String(counter));
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}, counter at ${counter}`);
});
