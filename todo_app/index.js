'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.PORT) || 3000;
const CACHE_DIR = process.env.CACHE_DIR || '/usr/src/app/cache';
const IMAGE_FILE = path.join(CACHE_DIR, 'image.jpg');
const STAMP_FILE = path.join(CACHE_DIR, 'image.timestamp');
const MAX_AGE_MS = 10 * 60 * 1000;

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
    const response = await fetch('https://picsum.photos/1200');
    if (!response.ok) {
      throw new Error(`picsum responded ${response.status}`);
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
  const age = cachedImageAge();
  if (age < MAX_AGE_MS) {
    const cached = readCachedImage();
    if (cached) {
      return cached;
    }
  }

  const fresh = await fetchNewImage();
  return fresh || readCachedImage();
};

const todos = ['Learn Kubernetes basics', 'Build the todo application', 'Cache the random image'];

const page = (imageState) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Todo app</title>
  </head>
  <body>
    <h1>Todo app</h1>
    ${imageState}
    <form action="/todo/todos" method="post">
      <input type="text" name="todo" maxlength="140" placeholder="What needs to be done?" />
      <button type="submit">Send</button>
    </form>
    <ul>
      ${todos.map((todo) => `<li>${todo}</li>`).join('\n      ')}
    </ul>
  </body>
</html>
`;

const server = http.createServer(async (req, res) => {
  // The Ingress publishes the project under the /todo prefix so that it can run next to the
  // other applications of the course on the same Traefik instance.
  const url = req.url.startsWith('/todo') ? req.url.slice('/todo'.length) || '/' : req.url;

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
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page('<img src="/todo/image" alt="Random image" width="480" />'));
    return;
  }

  if (req.method === 'POST' && url === '/todos') {
    // Creating todos against the backend arrives in a later exercise.
    res.writeHead(202, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Todo creation is not implemented yet\n');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found\n');
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
