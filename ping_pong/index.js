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
  max: 2,
});

// An idle client error (for example while the database restarts) must not take the process down.
pool.on('error', (error) => {
  console.error(`idle database client error: ${error.message}`);
});

const initialise = async () => {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS pongs (id integer PRIMARY KEY, value integer NOT NULL)',
  );
  await pool.query('INSERT INTO pongs (id, value) VALUES (1, 0) ON CONFLICT (id) DO NOTHING');
};

const waitForDatabase = async () => {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      await initialise();
      console.log('database ready');
      return;
    } catch (error) {
      console.error(`database not ready (attempt ${attempt}): ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.error('giving up on the database');
};

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.method === 'GET' && req.url === '/health') {
    try {
      await pool.query('SELECT 1');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ok\n');
    } catch (error) {
      console.error(`readiness check failed: ${error.message}`);
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('database unavailable\n');
    }

    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed\n');
    return;
  }

  try {
    const { rows } = await pool.query(
      'UPDATE pongs SET value = value + 1 WHERE id = 1 RETURNING value',
    );
    const current = rows[0].value - 1;

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`pong ${current}\n`);
  } catch (error) {
    console.error(`could not update the counter: ${error.message}`);
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('counter unavailable\n');
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
  waitForDatabase();
});
