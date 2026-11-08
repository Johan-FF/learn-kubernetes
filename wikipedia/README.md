# wikipedia

Exercise 5.4: an nginx container that serves a Wikipedia page which never ends up inside the
container image.

## How it works

| Container | Role |
| --- | --- |
| `fetch-once` (init) | Downloads `https://en.wikipedia.org/wiki/Kubernetes` into the shared `emptyDir` before nginx starts, so the first request already has content |
| `nginx` | Serves the shared directory |
| `refresh` (sidecar) | Every 30 seconds downloads the page again into the same directory |

The init container guarantees "the page exists before the web server starts"; the sidecar keeps it
fresh. Both write to an `emptyDir` mounted at `/usr/share/nginx/html`, so nothing is baked into
the image and the page survives neither the pod nor the volume, which is exactly the point of the
exercise.

## Run

```bash
kubectl apply -f manifests
kubectl rollout status deployment/wikipedia-dep -n wikipedia
kubectl port-forward -n wikipedia deployment/wikipedia-dep 8090:80
curl http://127.0.0.1:8090/ | head -5
```

For the local k3d cluster the Ingress publishes it on `/wikipedia` at `http://localhost:8081`.
