'use strict';

const fs = require('fs');
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const LOG_FILE = process.env.LOG_FILE || '/usr/src/app/files/output.txt';
const PING_FILE = process.env.PING_FILE || '/usr/src/app/data/pingpong.txt';

const lastLogLine = () => {
  try {
    const lines = fs
      .readFileSync(LOG_FILE, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
    return lines.length > 0 ? lines[lines.length - 1] : 'waiting for the writer';
  } catch {
    return 'waiting for the writer';
  }
};

const pingCount = () => {
  try {
    const stored = Number(fs.readFileSync(PING_FILE, 'utf8').trim());
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
};

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`${lastLogLine()}\nPing / Pongs: ${pingCount()}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
