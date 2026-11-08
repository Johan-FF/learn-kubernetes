# CNCF landscape (exercise 5.8)

The official [CNCF landscape](https://landscape.cncf.io) has hundreds of projects. Rather than
editing the published PNG, this directory records the marking: the projects this repository
actually uses, and where, split into what was used directly and what came along as a dependency.

`landscape.png` is rendered from the lists below by `scripts/render-landscape.ps1`, so the marking
and the written list cannot drift apart.

## Used directly

| Project | Where it was used |
| --- | --- |
| Kubernetes | The whole course: every manifest is applied to a cluster, locally on k3d and on GKE in chapter 3 |
| k3s | Local cluster distribution created with k3d (`k3d cluster create --image rancher/k3s:v1.34.1-k3s1`) |
| Helm | Installing Prometheus, Loki, Grafana, NATS and Argo Rollouts (2.10, 4.3, 4.6, 5.2) |
| Prometheus | Metrics for the monitoring stack and for Kiali (2.10, 4.3, 5.2) |
| Grafana | Viewing the rejected-todo log line (2.10) and the PromQL queries (4.3) |
| Loki | Log storage for exercise 2.10 |
| NATS | Message queue between the todo backend and the broadcaster (4.6) |
| Argo CD | GitOps for the Log output application and for the project's staging and production environments (4.7-4.9) |
| Argo Rollouts | Canary with a CPU analysis for the Ping-pong application (4.4) |
| Istio | Ambient service mesh, Kiali, the greeter traffic split (5.2, 5.3) |
| Knative | Serverless hello service and the Ping-pong service (5.6, 5.7) |
| containerd | Container runtime inside k3s; the cluster pulls the images pushed to Artifact Registry |
| CoreDNS | Service discovery (`ping-pong-svc`, `todo-backend-svc`, `pingpong.exercises.svc.cluster.local`) |

## Used indirectly

| Project | Depended on by |
| --- | --- |
| Flannel | k3s, as the default CNI of the local cluster |
| Envoy | Istio: the waypoint proxy that enforces the HTTPRoute |
| etcd | The GKE control plane of chapter 3 |
| kube-state-metrics | The Prometheus community chart, which scrapes it for cluster state |
| node-exporter | The same chart, for node level metrics |

## Outside the course

- Docker / Moby: build and push of every image in this repository, and the local container engine.
- GitHub Actions and Artifact Registry: the pipelines are part of the course, but both were already
  in daily use outside of it.
- GKE and Cloud NAT: introduced by the course, but the same project is used for other work.

Not listed but worth naming: Traefik (k3s ingress, disabled for the Knative exercises) and
Kourier (Knative's ingress) are not CNCF projects.
