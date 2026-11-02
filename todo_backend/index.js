'use strict';

const http = require('http');

const PORT = Number(process.env.PORT) || 3000;

// Todos are kept in memory until the database exercise.
let todos = [
  { id: 1, text: 'Learn Kubernetes basics' },
  { id: 2, text: 'Build the todo application' },
  { id: 3, text: 'Cache the random image' },
];
let nextId = 4;

const sendJson = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

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

const parseTodo = (body, contentType) => {
  if (contentType && contentType.includes('application/json')) {
    const parsed = JSON.parse(body);
    return typeof parsed.text === 'string' ? parsed.text : '';
  }

  return new URLSearchParams(body).get('text') || new URLSearchParams(body).get('todo') || '';
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/todos') {
    sendJson(res, 200, todos);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/todos') {
    let text;
    try {
      text = parseTodo(await readBody(req), req.headers['content-type']);
    } catch {
      sendJson(res, 400, { error: 'invalid body' });
      return;
    }

    text = (text || '').trim();
    if (text === '') {
      sendJson(res, 400, { error: 'todo text is required' });
      return;
    }

    const todo = { id: nextId, text };
    nextId += 1;
    todos.push(todo);
    sendJson(res, 201, todo);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
