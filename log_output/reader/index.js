'use strict';

const fs = require('fs');
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const LOG_FILE = process.env.LOG_FILE || '/usr/src/app/files/output.txt';
const PING_URL = process.env.PING_URL || 'http://ping-pong-svc:2345/pingpong';

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

const pingCount = async () => {
  try {
    const response = await fetch(PING_URL);
    if (!response.ok) {
      return 'unavailable';
    }

    const body = (await response.text()).trim();
    const match = body.match(/pong (\d+)/);
    return match ? match[1] : 'unavailable';
  } catch {
    return 'unavailable';
  }
};

const server = http.createServer(async (req, res) => {
  const pongs = await pingCount();
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`${lastLogLine()}\nPing / Pongs: ${pongs}\n`);
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}, asking ${PING_URL}`);
});
