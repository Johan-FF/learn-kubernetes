# log_output

Exercise 1.1 application of the DevOps with Kubernetes course.

A Node.js process that generates a random UUID once at startup, keeps it in memory and
prints it with an ISO timestamp every 5 seconds.

## Run locally

```bash
npm start
```

## Build and load the image into k3d

```bash
docker build -t log_output:1.1 .
k3d image import log_output:1.1 -c devops
```

## Deploy

```bash
kubectl apply -f manifests/deployment.yaml
kubectl rollout status deployment/log-output-dep
kubectl logs -f deployment/log-output-dep
```

The image tag is declared in `manifests/deployment.yaml`; update it when a later exercise
changes the output so the cluster picks up the new build.
