'use strict';

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const LOG_FILE = process.env.LOG_FILE || '/usr/src/app/files/output.txt';

// Generated once at startup and kept in memory for the lifetime of the process.
const hash = randomUUID();

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const write = () => {
  const line = `${new Date().toISOString()}: ${hash}`;
  fs.appendFileSync(LOG_FILE, `${line}\n`);
  console.log(line);
};

write();
setInterval(write, 5000);
