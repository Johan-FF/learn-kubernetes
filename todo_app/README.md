# todo_app

The course project: a todo application. It starts as a minimal web server (exercise 1.2) and gains
functionality exercise by exercise.

## Run locally

```bash
PORT=3001 CACHE_DIR=./cache npm start
```

Prints `Server started in port <PORT>` when it is up.

## Routes

| Route | Response |
| --- | --- |
| `GET /` | The HTML page |
| `GET /image` | The cached random image |

When the application runs behind the shared Traefik ingress it is published under the `/todo`
prefix, and the server strips that prefix before routing. This lets the project run on the same
host as the "Log output" application (`/`) and the "Ping-pong" application (`/pingpong`).

## Random image cache (exercise 1.12)

The image is fetched from `https://picsum.photos/1200` and stored in the directory configured with
`CACHE_DIR`, together with the timestamp of the fetch:

- while the cached image is younger than 10 minutes it is served without contacting the API;
- after that the next request fetches a new image;
- if the API is unreachable the previously cached image is still served.

`CACHE_DIR` is mounted from the `todo-cache-pvc` PersistentVolumeClaim, so the image also survives
pod restarts: the process finds the file and its timestamp on startup.

```bash
kubectl apply -f volumes
kubectl apply -f manifests
kubectl rollout status deployment/todo-app-dep
curl http://127.0.0.1:8081/todo
```

## Build and load the image into k3d

```bash
docker build -t todo_app:1.12 .
k3d image import todo_app:1.12 -c devops --mode direct
kubectl rollout restart deployment/todo-app-dep
```

The image tag is declared in `manifests/deployment.yaml`. A rebuilt image with an unchanged tag is
only picked up after `kubectl rollout restart`, because the Deployment uses
`imagePullPolicy: IfNotPresent`.

## Networking

- `kubectl port-forward deployment/todo-app-dep 3003:3000` for a direct local check.
- `manifests/service.yaml` is a ClusterIP Service on port `2345`.
- `manifests/ingress.yaml` publishes the application on the `/todo` path.
