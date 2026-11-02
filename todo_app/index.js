'use strict';

const fs = require('fs');
const path = require('path');
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
const CACHE_DIR = required('CACHE_DIR');
const BACKEND_URL = required('TODO_BACKEND_URL');
const PUBLIC_PATH = required('PUBLIC_PATH');
const IMAGE_URL = required('IMAGE_URL');
const IMAGE_MAX_AGE_MS = Number(required('IMAGE_CACHE_MINUTES')) * 60 * 1000;

const IMAGE_FILE = path.join(CACHE_DIR, 'image.jpg');
const STAMP_FILE = path.join(CACHE_DIR, 'image.timestamp');

fs.mkdirSync(CACHE_DIR, { recursive: true });

const readCachedImage = () => {
  try {
    return fs.readFileSync(IMAGE_FILE);
  } catch {
    return null;
  }
};

const cachedImageAge = () => {
  try {
    return Date.now() - Number(fs.readFileSync(STAMP_FILE, 'utf8'));
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

const fetchNewImage = async () => {
  try {
    const response = await fetch(IMAGE_URL);
    if (!response.ok) {
      throw new Error(`image service responded ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(IMAGE_FILE, buffer);
    fs.writeFileSync(STAMP_FILE, String(Date.now()));
    console.log(`cached a new image (${buffer.length} bytes)`);
    return buffer;
  } catch (error) {
    console.error(`could not fetch a new image: ${error.message}`);
    return null;
  }
};

const currentImage = async () => {
  if (cachedImageAge() < IMAGE_MAX_AGE_MS) {
    const cached = readCachedImage();
    if (cached) {
      return cached;
    }
  }

  const fresh = await fetchNewImage();
  return fresh || readCachedImage();
};

const fetchTodos = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/todos`);
    if (!response.ok) {
      throw new Error(`backend responded ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`could not read todos: ${error.message}`);
    return null;
  }
};

const createTodo = async (body, contentType) => {
  const response = await fetch(`${BACKEND_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': contentType || 'application/x-www-form-urlencoded' },
    body,
  });

  return response.status;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const todoList = (todos) => {
  if (todos === null) {
    return '<p class="error">The todo backend is not reachable right now.</p>';
  }

  if (todos.length === 0) {
    return '<p>No todos yet.</p>';
  }

  return `<ul>
      ${todos.map((todo) => `<li>${escapeHtml(todo.text)}</li>`).join('\n      ')}
    </ul>`;
};

const page = (todos) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Todo app</title>
  </head>
  <body>
    <h1>Todo app</h1>
    <img src="${PUBLIC_PATH}/image" alt="Random image" width="480" />
    <form action="${PUBLIC_PATH}/todos" method="post">
      <input type="text" name="todo" maxlength="140" placeholder="What needs to be done?" required />
      <button type="submit">Send</button>
    </form>
    ${todoList(todos)}
  </body>
</html>
`;

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
  // The Ingress publishes the project under its public path prefix so that it can run next to
  // the other applications of the course on the same Traefik instance.
  const url = req.url.startsWith(PUBLIC_PATH)
    ? req.url.slice(PUBLIC_PATH.length) || '/'
    : req.url;

  if (req.method === 'GET' && url === '/image') {
    const image = await currentImage();
    if (!image) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('image unavailable\n');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(image);
    return;
  }

  if (req.method === 'GET' && url === '/') {
    const todos = await fetchTodos();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page(todos));
    return;
  }

  if (req.method === 'POST' && url === '/todos') {
    try {
      const status = await createTodo(await readBody(req), req.headers['content-type']);
      if (status >= 400) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('The todo was rejected by the backend\n');
        return;
      }
    } catch (error) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Could not reach the todo backend: ${error.message}\n`);
      return;
    }

    res.writeHead(302, { Location: PUBLIC_PATH });
    res.end();
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}, backend at ${BACKEND_URL}`);
});
