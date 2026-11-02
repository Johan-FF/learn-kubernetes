# broadcaster

Service added in exercise 4.6. It subscribes to the NATS subject `todos.events` inside the
`broadcasters` **queue group** and forwards every event to an external webhook.

## Why a queue group

A plain subscription delivers every message to every subscriber, so six replicas would send six
copies of each notification. With a queue group NATS delivers each message to exactly one member
of the group, which is what makes the service safe to scale horizontally.

## Payload

The broadcaster sends the generic format:

```json
{ "user": "bot", "message": "A todo was created: buy coffee" }
```

Point `WEBHOOK_URL` at a Discord, Slack or Telegram webhook and adjust the body shape in
`index.js` for that provider. The local deployment points at `webhook-sink-svc`, a tiny service in
this repository that records the received payloads so the exercise can be verified without an
external account.

## Verify

```bash
kubectl logs -n project -l app=broadcaster --tail 5
kubectl exec -n project deployment/webhook-sink-dep -- wget -qO- http://127.0.0.1:3000/messages
```
