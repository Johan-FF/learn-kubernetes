# DevOps with Kubernetes — exercise submissions

Solutions for the [DevOps with Kubernetes](https://devopswithkubernetes.com) course
(University of Helsinki). Each exercise is tagged with its own number and the tag points to the
state of the repository at the moment that exercise was submitted.

## Repository layout

One directory per application. Applications are reused across exercises and grow as the course
progresses:

| Directory | Purpose |
| --- | --- |
| `log_output/` | Log output application, starting at exercise 1.1 |
| `ping_pong/` | Ping-pong counter application, starting at exercise 1.9 |
| `todo_app/` | Todo frontend, the course project, starting at exercise 1.2 |
| `todo_backend/` | Todo backend, starting at exercise 2.2 |
| `postgres/` | PostgreSQL manifests for the stateful exercises |
| `project/` | Project umbrella manifests, Kustomize overlays, CI and GitOps |
| `dummysite/` | DummySite CRD and controller (exercise 5.1) |
| `wikipedia/` | Init container and sidecar exercise (5.4) |
| `greeter/` | Greeter service used by the service mesh exercise (5.3) |
| `infra/` | Helm values and platform installs (Prometheus, Argo, Istio, Knative) |
| `scripts/` | Helper scripts for building, deploying and tagging exercises |
| `docs/` | Course material used as the source of truth |

## Local cluster

```bash
k3d cluster create devops -a 1 -p 8081:80@loadbalancer -p 8082:30080@agent:0 \
  --k3s-arg "--disable=metrics-server@server:0"
kubectl get nodes
```

Applications are built locally and loaded into the cluster, no registry needed:

```bash
docker build -t <app>:<tag> <app>
k3d image import <app>:<tag> -c devops
```

## Exercises

| Exercise | Title | Application | Release |
| --- | --- | --- | --- |
| 1.1 | Getting started | `log_output/` | [1.1](https://github.com/REPLACE_ME/kubernetes-submissions/tree/1.1/log_output) |
