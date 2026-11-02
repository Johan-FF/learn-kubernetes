'use strict';

const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    console.error(`missing required environment variable ${name}`);
    process.exit(1);
  }

  return value;
};

const BACKEND_URL = required('TODO_BACKEND_URL');
const WIKIPEDIA_URL = required('WIKIPEDIA_URL');

const run = async () => {
  const article = await fetch(WIKIPEDIA_URL).then((response) => {
    if (!response.ok) {
      throw new Error(`wikipedia responded ${response.status}`);
    }

    return response.json();
  });

  const text = `Read ${article.content_urls.desktop.page}`;
  const response = await fetch(`${BACKEND_URL}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`backend responded ${response.status}`);
  }

  console.log(`created todo: ${text}`);
};

run().catch((error) => {
  console.error(`could not create a todo: ${error.message}`);
  process.exit(1);
});
