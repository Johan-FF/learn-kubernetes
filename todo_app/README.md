# todo_app

The course project, a todo application. It starts as a minimal web server (exercise 1.2) and
gains functionality exercise by exercise.

## Run locally

```bash
PORT=3001 npm start
```

Prints `Server started in port <PORT>` when it is up.

## Build and load the image into k3d

```bash
docker build -t todo_app:1.2 .
k3d image import todo_app:1.2 -c devops
```

## Deploy

```bash
kubectl apply -f manifests/deployment.yaml
kubectl rollout status deployment/todo-app-dep
kubectl logs deployment/todo-app-dep
```

The port is configured through the `PORT` environment variable, which the Deployment sets and the
image also defaults to `3000`.

## Declarative deployment (exercise 1.4)

The project deployment is `manifests/deployment.yaml` and is the only source of truth for how the
application runs in the cluster:

```bash
kubectl apply -f manifests/deployment.yaml
kubectl rollout status deployment/todo-app-dep
```

No port is exposed to the outside yet; networking is added in later exercises.

## Networking (exercises 1.5 and 1.6)

Local check through the API server, without touching the Service:

```bash
kubectl port-forward deployment/todo-app-dep 3003:3000
curl http://127.0.0.1:3003/
```

`manifests/service.yaml` exposes the application with a NodePort Service: service port `2345`
forwards to the container port `3000`, and node port `30080` is published by the local k3d
cluster on `localhost:8082`.

```bash
kubectl apply -f manifests/service.yaml
curl http://127.0.0.1:8082/
```

