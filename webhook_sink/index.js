'use strict';

const http = require('http');

const PORT = Number(process.env.PORT);

// Keeps the last messages so the exercise can be verified without an external chat service.
const messages = [];
const MAX_MESSAGES = 50;

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/messages') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(messages));
    return;
  }

  if (req.method === 'POST' && req.url === '/messages') {
    try {
      const body = await readBody(req);
      messages.push(JSON.parse(body));
      if (messages.length > MAX_MESSAGES) {
        messages.shift();
      }

      console.log(`received webhook: ${body}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end('{"status":"received"}');
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error.message }));
    }

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
