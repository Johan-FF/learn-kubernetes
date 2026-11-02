# webhook_sink

Local stand-in for the external chat service of exercise 4.6. It accepts any JSON payload on
`POST /messages`, keeps the last 50 in memory and returns them on `GET /messages`.

It exists only so the broadcaster can be verified end to end without a Discord, Slack or Telegram
account. Swapping it for a real webhook is a matter of changing `WEBHOOK_URL` in
`broadcaster/manifests/deployment.yaml`.

```bash
kubectl apply -f manifests
kubectl rollout status deployment/webhook-sink-dep -n project
kubectl exec -n project deployment/webhook-sink-dep -- wget -qO- http://127.0.0.1:3000/messages
```
