'use strict';

const { randomUUID } = require('crypto');

// Generated once at startup and kept in memory for the lifetime of the process.
const hash = randomUUID();

const print = () => {
  console.log(`${new Date().toISOString()}: ${hash}`);
};

print();
setInterval(print, 5000);
