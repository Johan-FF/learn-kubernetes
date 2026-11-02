# ping_pong

Ping-pong counter application, first introduced in exercise 1.9.

Every GET request increments an in-memory counter and answers with the value the counter held
before the increment, so the first request of a fresh process answers `pong 0`.

## Run locally

```bash
PORT=3001 npm start
curl http://127.0.0.1:3001/pingpong
```

## Build and load the image into k3d

```bash
docker build -t ping_pong:1.9 .
k3d image import ping_pong:1.9 -c devops --mode direct
```

## Deploy

```bash
kubectl apply -f manifests/deployment.yaml -f manifests/service.yaml -f manifests/ingress.yaml
kubectl rollout status deployment/ping-pong-dep
curl http://127.0.0.1:8081/pingpong
```

The Service is a ClusterIP exposing port `2345`, and the Ingress publishes it under the
`/pingpong` path of the shared Traefik ingress, next to the `/` path of the "Log output"
application.

The counter is process memory, so it resets when the pod is restarted. Later exercises move the
state to a shared volume and then to a database.
