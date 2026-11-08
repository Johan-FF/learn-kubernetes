# gke

Manifests for the Google Kubernetes Engine exercises (chapter 3 of the course).

## Cluster

| Item | Value |
| --- | --- |
| Project | `project-74b28d99-70ba-47ca-9bc` |
| Cluster | `dwk-cluster`, zonal in `europe-north1-a` |
| Nodes | 2 × `e2-small`, **private nodes** with Cloud NAT |
| Registry | `europe-north1-docker.pkg.dev/project-74b28d99-70ba-47ca-9bc/dwk` |
| Namespace | `dwk-gke` |

Nodes are private because the organisation policy `constraints/compute.vmExternalIpAccess`
forbids VMs with external IPs. Egress goes through the Cloud NAT on `dwk-router`.

The control plane is reachable only from the IP added to the master authorised networks, which is
why `gcloud container clusters update ... --master-authorized-networks` is part of the setup.

## Images

GKE cannot pull images from the local Docker daemon, so every application used here is built and
pushed to Artifact Registry first:

```bash
./scripts/push-image.ps1 -App ping_pong -Tag 3.1
./scripts/push-image.ps1 -App log_output/writer -Tag 3.1
./scripts/push-image.ps1 -App log_output/reader -Tag 3.1
```

## Exercises

| Exercise | Directory | What changes |
| --- | --- | --- |
| 3.1 | `3.1/` | "Ping-pong" behind a LoadBalancer Service |
| 3.2 | `3.2/` | Both applications behind a GKE Ingress |
| 3.3 | `3.3/` | Ingress replaced with the Gateway API |
| 3.4 | `3.4/` | `URLRewrite` so the application serves `/` |

```bash
kubectl apply -k gke/3.1
kubectl get pods,svc -n dwk-gke
```
