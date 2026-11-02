# todo_backend

Backend service of the course project, introduced in exercise 2.2. It owns the todo items while
the frontend only renders them.

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/todos` | Returns the todo list as JSON |
| `POST` | `/todos` | Creates a todo from a JSON body `{"text": "..."}` or a form field `text` |
| `GET` | `/health` | Liveness check |

Todos live in memory, so they are lost when the pod restarts. The database arrives in exercise 2.8.

## Run locally

```bash
PORT=3002 npm start
curl http://127.0.0.1:3002/todos
curl -X POST -H 'Content-Type: application/json' -d '{"text":"new todo"}' http://127.0.0.1:3002/todos
```

## Deploy

```bash
docker build -t todo_backend:2.2 .
k3d image import todo_backend:2.2 -c devops --mode direct
kubectl apply -f manifests
kubectl rollout status deployment/todo-backend-dep
```

The Service `todo-backend-svc` exposes port `2345` inside the cluster and is reached by the
frontend through Kubernetes DNS at `http://todo-backend-svc:2345`.
