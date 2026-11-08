# DevOps with Kubernetes — exercise submissions

Solutions for the [DevOps with Kubernetes](https://devopswithkubernetes.com) course
(University of Helsinki). Each exercise is tagged with its own number and the tag points to the
state of the repository at the moment that exercise was submitted.

## Repository layout

One directory per application. Applications are reused across exercises and grow as the course
progresses:

| Directory | Purpose |
| --- | --- |
| `log_output/` | Log output application: writer/reader pod, Ingress, HTTP link to ping-pong |
| `ping_pong/` | Ping-pong counter application |
| `todo_app/` | Todo frontend, the course project |
| `todo_backend/` | Todo backend, starting at exercise 2.2 |
| `postgres/` | PostgreSQL manifests for the stateful exercises |
| `project/` | Project umbrella manifests, Kustomize overlays, CI and GitOps |
| `volumes/` | Cluster-level PersistentVolumes and their claims |
| `dummysite/` | DummySite CRD and controller (exercise 5.1) |
| `wikipedia/` | Init container and sidecar exercise (5.4) |
| `greeter/` | Greeter service used by the service mesh exercise (5.3) |
| `infra/` | Helm values and platform installs (Prometheus, Argo, Istio, Knative) |
| `scripts/` | Helper scripts for building, deploying and tagging exercises |
| `docs/` | Course material used as the source of truth |

## Local cluster

```bash
k3d cluster create devops -a 1 -p 8081:80@loadbalancer -p 8082:30080@agent:0 \
  --image rancher/k3s:v1.34.1-k3s1 --k3s-arg "--disable=metrics-server@server:0"
kubectl get nodes
```

The k3s image is pinned because Docker Desktop on this machine runs cgroup v1, which k3s 1.35 and
later refuse to run on.

Applications are built locally and loaded into the cluster, no registry needed:

```bash
docker build -t <app>:<tag> <app>
k3d image import <app>:<tag> -c devops --mode direct
```

## Exercises

| Exercise | Title | Application | Release |
| --- | --- | --- | --- |
| 1.1 | Getting started | `log_output/` | [1.1](https://github.com/Johan-FF/learn-kubernetes/tree/1.1/log_output) |
| 1.2 | The project, step 1 | `todo_app/` | [1.2](https://github.com/Johan-FF/learn-kubernetes/tree/1.2/todo_app) |
| 1.3 | Declarative approach | `log_output/` | [1.3](https://github.com/Johan-FF/learn-kubernetes/tree/1.3/log_output) |
| 1.4 | The project, step 2 | `todo_app/` | [1.4](https://github.com/Johan-FF/learn-kubernetes/tree/1.4/todo_app) |
| 1.5 | The project, step 3 | `todo_app/` | [1.5](https://github.com/Johan-FF/learn-kubernetes/tree/1.5/todo_app) |
| 1.6 | The project, step 4 | `todo_app/` | [1.6](https://github.com/Johan-FF/learn-kubernetes/tree/1.6/todo_app) |
| 1.7 | External access with Ingress | `log_output/` | [1.7](https://github.com/Johan-FF/learn-kubernetes/tree/1.7/log_output) |
| 1.8 | The project, step 5 | `todo_app/` | [1.8](https://github.com/Johan-FF/learn-kubernetes/tree/1.8/todo_app) |
| 1.9 | More services | `ping_pong/` | [1.9](https://github.com/Johan-FF/learn-kubernetes/tree/1.9/ping_pong) |
| 1.10 | Even more services | `log_output/` | [1.10](https://github.com/Johan-FF/learn-kubernetes/tree/1.10/log_output) |
| 1.11 | Persisting data | `ping_pong/`, `volumes/` | [1.11](https://github.com/Johan-FF/learn-kubernetes/tree/1.11/ping_pong) |
| 1.12 | The project, step 6 | `todo_app/` | [1.12](https://github.com/Johan-FF/learn-kubernetes/tree/1.12/todo_app) |
| 1.13 | The project, step 7 | `todo_app/` | [1.13](https://github.com/Johan-FF/learn-kubernetes/tree/1.13/todo_app) |
| 2.1 | Connecting pods | `log_output/`, `ping_pong/` | [2.1](https://github.com/Johan-FF/learn-kubernetes/tree/2.1/log_output) |
| 2.2 | The project, step 8 | `todo_backend/` | [2.2](https://github.com/Johan-FF/learn-kubernetes/tree/2.2/todo_backend) |
| 2.3 | Keep them separated | `log_output/`, `ping_pong/` | [2.3](https://github.com/Johan-FF/learn-kubernetes/tree/2.3/log_output) |
| 2.4 | The project, step 9 | `todo_app/`, `todo_backend/` | [2.4](https://github.com/Johan-FF/learn-kubernetes/tree/2.4/todo_app) |
| 2.5 | Documentation and ConfigMaps | `log_output/` | [2.5](https://github.com/Johan-FF/learn-kubernetes/tree/2.5/log_output) |
| 2.6 | The project, step 10 | `todo_app/`, `todo_backend/` | [2.6](https://github.com/Johan-FF/learn-kubernetes/tree/2.6/todo_app) |
| 2.7 | Stateful applications | `ping_pong/`, `postgres/` | [2.7](https://github.com/Johan-FF/learn-kubernetes/tree/2.7/ping_pong) |
| 2.8 | The project, step 11 | `todo_backend/`, `postgres/` | [2.8](https://github.com/Johan-FF/learn-kubernetes/tree/2.8/todo_backend) |
| 2.9 | The project, step 12 | `todo_generator/` | [2.9](https://github.com/Johan-FF/learn-kubernetes/tree/2.9/todo_generator) |
| 4.1 | Readiness probe | `log_output/`, `ping_pong/` | [4.1](https://github.com/Johan-FF/learn-kubernetes/tree/4.1/log_output) |
| 4.2 | The project, step 21 | `todo_app/`, `todo_backend/` | [4.2](https://github.com/Johan-FF/learn-kubernetes/tree/4.2/todo_app) |
| 4.5 | The project, step 22 | `todo_app/`, `todo_backend/` | [4.5](https://github.com/Johan-FF/learn-kubernetes/tree/4.5/todo_app) |
| 4.6 | The project, step 23 | `broadcaster/`, `todo_backend/` | [4.6](https://github.com/Johan-FF/learn-kubernetes/tree/4.6/broadcaster) |
| 2.10 | The project, step 13 | `todo_backend/`, `infra/monitoring/` | [2.10](https://github.com/Johan-FF/learn-kubernetes/tree/2.10/todo_backend) |
| 4.3 | Prometheus | `infra/monitoring/` | [4.3](https://github.com/Johan-FF/learn-kubernetes/tree/4.3/infra/monitoring) |
| 3.1 | Pingpong GKE | `gke/3.1/` | [3.1](https://github.com/Johan-FF/learn-kubernetes/tree/3.1/gke/3.1) |
| 3.2 | Back to Ingress | `gke/3.2/` | [3.2](https://github.com/Johan-FF/learn-kubernetes/tree/3.2/gke/3.2) |
| 3.3 | To the Gateway | `gke/3.3/` | [3.3](https://github.com/Johan-FF/learn-kubernetes/tree/3.3/gke/3.3) |
| 3.4 | Rewritten routing | `gke/3.4/` | [3.4](https://github.com/Johan-FF/learn-kubernetes/tree/3.4/gke/3.4) |
| 3.5 | The project, step 14 | `project/` | [3.5](https://github.com/Johan-FF/learn-kubernetes/tree/3.5/project) |
| 3.6 | The project, step 15 | `.github/workflows/` | [3.6](https://github.com/Johan-FF/learn-kubernetes/tree/3.6/.github/workflows) |
| 3.7 | The project, step 16 | `.github/workflows/deploy.yml` | [3.7](https://github.com/Johan-FF/learn-kubernetes/tree/3.7/.github/workflows) |
| 3.8 | The project, step 17 | `.github/workflows/cleanup.yml` | [3.8](https://github.com/Johan-FF/learn-kubernetes/tree/3.8/.github/workflows) |
| 3.9 | DBaaS vs DIY | `project/README.md` | [3.9](https://github.com/Johan-FF/learn-kubernetes/tree/3.9/project) |
| 3.10 | The project, step 18 | `backup/`, `project/` | [3.10](https://github.com/Johan-FF/learn-kubernetes/tree/3.10/backup) |
| 3.11 | The project, step 19 | `project/resources.md` | [3.11](https://github.com/Johan-FF/learn-kubernetes/tree/3.11/project) |
| 3.12 | The project, step 20 | `project/logs/` | [3.12](https://github.com/Johan-FF/learn-kubernetes/tree/3.12/project) |
| 5.1 | DIY CRD & Controller | `dummysite/` | [5.1](https://github.com/Johan-FF/learn-kubernetes/tree/5.1/dummysite) |
| 5.4 | Wikipedia with init and sidecar | `wikipedia/` | [5.4](https://github.com/Johan-FF/learn-kubernetes/tree/5.4/wikipedia) |
| 5.5 | Platform comparison | `platform-comparison/` | [5.5](https://github.com/Johan-FF/learn-kubernetes/tree/5.5/platform-comparison) |
| 4.7 | Baby steps to GitOps | `argocd/` | [4.7](https://github.com/Johan-FF/learn-kubernetes/tree/4.7/argocd) |
| 4.8 | The project, step 24 | `argocd/application-project.yaml` | [4.8](https://github.com/Johan-FF/learn-kubernetes/tree/4.8/project/overlays/local) |
