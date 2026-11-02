'use strict';

const http = require('http');
const { Pool } = require('pg');

const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    console.error(`missing required environment variable ${name}`);
    process.exit(1);
  }

  return value;
};

const PORT = Number(required('PORT'));

const pool = new Pool({
  host: required('PG_HOST'),
  port: Number(required('PG_PORT')),
  user: required('PG_USER'),
  password: required('PG_PASSWORD'),
  database: required('PG_DATABASE'),
  max: 5,
});

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

const initialise = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id serial PRIMARY KEY,
      text text NOT NULL
    )
  `);
};

let schemaReady = false;

const ensureSchema = async () => {
  if (schemaReady) {
    return;
  }

  await initialise();
  schemaReady = true;
  console.log('database ready');
};

const waitForDatabase = async () => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await ensureSchema();
      return;
    } catch (error) {
      console.error(`database not ready (attempt ${attempt}): ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/todos') {
    try {
      await ensureSchema();
      const { rows } = await pool.query('SELECT id, text FROM todos ORDER BY id');
      sendJson(res, 200, rows);
    } catch (error) {
      console.error(`could not read todos: ${error.message}`);
      sendJson(res, 503, { error: 'database unavailable' });
    }

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

    try {
      await ensureSchema();
      const { rows } = await pool.query(
        'INSERT INTO todos (text) VALUES ($1) RETURNING id, text',
        [text],
      );
      sendJson(res, 201, rows[0]);
    } catch (error) {
      console.error(`could not save todo: ${error.message}`);
      sendJson(res, 503, { error: 'database unavailable' });
    }

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
  waitForDatabase();
});
