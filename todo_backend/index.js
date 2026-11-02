'use strict';

const http = require('http');
const { connect, StringCodec } = require('nats');
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
const MAX_TODO_LENGTH = Number(required('MAX_TODO_LENGTH'));

const pool = new Pool({
  host: required('PG_HOST'),
  port: Number(required('PG_PORT')),
  user: required('PG_USER'),
  password: required('PG_PASSWORD'),
  database: required('PG_DATABASE'),
  max: 5,
});

// An idle client error (for example while the database restarts) must not take the process down.
pool.on('error', (error) => {
  console.error(`idle database client error: ${error.message}`);
});

const NATS_URL = required('NATS_URL');
const NATS_SUBJECT = required('NATS_SUBJECT');
const codec = StringCodec();

let nats = null;

const connectNats = async () => {
  for (;;) {
    try {
      nats = await connect({ servers: NATS_URL });
      console.log(`connected to NATS at ${NATS_URL}`);
      return;
    } catch (error) {
      console.error(`NATS not ready: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

// Publishing is best effort: a missing message is acceptable, a failing request is not.
const publish = (message) => {
  try {
    if (nats && !nats.isClosed()) {
      nats.publish(NATS_SUBJECT, codec.encode(JSON.stringify({ message })));
    }
  } catch (error) {
    console.error(`could not publish to NATS: ${error.message}`);
  }
};

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
  await pool.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS done boolean NOT NULL DEFAULT false');
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
  const started = Date.now();
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.on('finish', () => {
    console.log(
      `${req.method} ${url.pathname} -> ${res.statusCode} (${Date.now() - started}ms) from ${req.socket.remoteAddress}`,
    );
  });

  if (req.method === 'GET' && url.pathname === '/todos') {
    try {
      await ensureSchema();
      const { rows } = await pool.query('SELECT id, text, done FROM todos ORDER BY id');
      sendJson(res, 200, rows);
    } catch (error) {
      console.error(`could not read todos: ${error.message}`);
      sendJson(res, 503, { error: 'database unavailable' });
    }

    return;
  }

  const todoIdMatch = url.pathname.match(/^\/todos\/(\d+)$/);
  if (req.method === 'PUT' && todoIdMatch) {
    try {
      await ensureSchema();
      const { rows } = await pool.query(
        'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING id, text, done',
        [Number(todoIdMatch[1])],
      );

      if (rows.length === 0) {
        sendJson(res, 404, { error: 'todo not found' });
        return;
      }

      sendJson(res, 200, rows[0]);
      publish(`A todo was updated: ${rows[0].text} (done=${rows[0].done})`);
    } catch (error) {
      console.error(`could not update todo: ${error.message}`);
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

    if (text.length > MAX_TODO_LENGTH) {
      console.warn(
        `rejected todo: ${text.length} characters, limit is ${MAX_TODO_LENGTH}: ${JSON.stringify(text)}`,
      );
      sendJson(res, 400, { error: `todo text must be at most ${MAX_TODO_LENGTH} characters` });
      return;
    }

    try {
      await ensureSchema();
      const { rows } = await pool.query(
        'INSERT INTO todos (text) VALUES ($1) RETURNING id, text, done',
        [text],
      );
      sendJson(res, 201, rows[0]);
      publish(`A todo was created: ${rows[0].text}`);
    } catch (error) {
      console.error(`could not save todo: ${error.message}`);
      sendJson(res, 503, { error: 'database unavailable' });
    }

    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    try {
      await pool.query('SELECT 1');
      sendJson(res, 200, { status: 'ok' });
    } catch (error) {
      console.error(`health check failed: ${error.message}`);
      sendJson(res, 503, { status: 'database unavailable' });
    }

    return;
  }

  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
  waitForDatabase();
  connectNats();
});
