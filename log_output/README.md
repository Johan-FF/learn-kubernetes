# log_output

"Log output" application of the DevOps with Kubernetes course.

## Layout

Since exercise 1.10 the application is one pod with two containers:

| Directory | Role |
| --- | --- |
| `writer/` | Generates a random UUID at startup and appends `timestamp: hash` to a file every 5 seconds |
| `reader/` | Serves the content of that file over HTTP |

Both containers mount the same `emptyDir` volume, so the reader always sees what the writer has
written without the two processes knowing anything about each other.

## Build and load the images into k3d

```bash
docker build -t log-output-writer:1.10 ./writer
docker build -t log-output-reader:1.10 ./reader
k3d image import log-output-writer:1.10 log-output-reader:1.10 -c devops --mode direct
```

## Deploy

```bash
kubectl apply -f manifests
kubectl rollout status deployment/log-output-dep
curl http://127.0.0.1:8081/
```

The image tags are declared in `manifests/deployment.yaml`; update them when a later exercise
changes the output so the cluster picks up the new build.

## Declarative deployment (exercise 1.3)

The Deployment exists only as `manifests/deployment.yaml`. Kubernetes is reconciled to that file
with `kubectl apply`, so a change of image tag or replicas is applied the same way:

```bash
kubectl apply -f manifests/deployment.yaml
kubectl rollout status deployment/log-output-dep
```

Deleting the resource is only used when re-creating it from scratch for revision; ordinary
updates are re-applied on top so the rollout stays available.

