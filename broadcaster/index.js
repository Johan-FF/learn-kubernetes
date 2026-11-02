'use strict';

const { connect, StringCodec } = require('nats');

const required = (name) => {
  const value = process.env[name];
  if (value === undefined || value === '') {
    console.error(`missing required environment variable ${name}`);
    process.exit(1);
  }

  return value;
};

const NATS_URL = required('NATS_URL');
const SUBJECT = required('NATS_SUBJECT');
const QUEUE_GROUP = required('NATS_QUEUE_GROUP');
const WEBHOOK_URL = required('WEBHOOK_URL');
const WEBHOOK_USER = required('WEBHOOK_USER');

const codec = StringCodec();

const forward = async (event) => {
  const payload = {
    user: WEBHOOK_USER,
    message: event.message,
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`webhook responded ${response.status}`);
  }

  console.log(`forwarded: ${payload.message}`);
};

const main = async () => {
  const connection = await connect({ servers: NATS_URL });
  console.log(`connected to ${NATS_URL}, subscribing to ${SUBJECT} in queue ${QUEUE_GROUP}`);

  // The queue group is what allows running several replicas without duplicate deliveries:
  // NATS hands each message to exactly one member of the group.
  const subscription = connection.subscribe(SUBJECT, { queue: QUEUE_GROUP });

  for await (const message of subscription) {
    try {
      const event = JSON.parse(codec.decode(message.data));
      await forward(event);
    } catch (error) {
      console.error(`could not forward the message: ${error.message}`);
    }
  }
};

main().catch((error) => {
  console.error(`broadcaster failed: ${error.message}`);
  process.exit(1);
});
