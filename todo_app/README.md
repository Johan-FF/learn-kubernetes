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
