'use strict';

const fs = require('fs');
const http = require('http');

const PORT = Number(process.env.PORT);
const LOG_FILE = process.env.LOG_FILE;
const PING_URL = process.env.PING_URL;
const INFORMATION_FILE = process.env.INFORMATION_FILE;
const MESSAGE = process.env.MESSAGE;

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

const informationFile = () => {
  try {
    return fs.readFileSync(INFORMATION_FILE, 'utf8').trim();
  } catch {
    return 'information file not available';
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
  if (req.method === 'GET' && req.url === '/health') {
    const pongs = await pingCount();
    if (pongs === 'unavailable') {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ping-pong unavailable\n');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok\n');
    return;
  }

  const pongs = await pingCount();
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(
    `file content: ${informationFile()}\n` +
      `env variable: MESSAGE=${MESSAGE}\n` +
      `${lastLogLine()}\n` +
      `Ping / Pongs: ${pongs}\n`,
  );
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
