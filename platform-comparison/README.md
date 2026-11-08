# Rancher vs OpenShift (exercise 5.5)

Arbitrary decision: **Rancher is the better fit for this project**. Bullet points, as allowed by
the exercise.

## Why Rancher

- **Same distribution we already use.** k3d runs k3s, which is Rancher's lightweight Kubernetes.
  Everything in this repository (manifests, Kustomize overlays, Helm values) applies unchanged to a
  Rancher-managed cluster; there is no flavour lock-in to re-learn.
- **Cluster-agnostic management plane.** Rancher imports existing clusters from any provider
  (GKE, EKS, on-prem, k3s), so the same UI and RBAC cover the local k3d cluster and the GKE cluster
  from chapter 3 instead of forcing a migration to one vendor's distribution.
- **Cost.** Rancher is open source and free; RKE2/k3s can run on three small VMs. OpenShift needs a
  subscription per worker for the supported product, and even OKD is a heavier footprint.
- **Operational weight.** A single Rancher server plus k3s nodes is comfortable on modest hardware,
  which matters when the whole course runs on a laptop-class machine.
- **Escape hatch.** Because it manages standard upstream Kubernetes, removing Rancher leaves a
  working cluster. Nothing in the workloads has to be rewritten.
- **GitOps-friendly by default.** Fleet ships with Rancher, so the ArgoCD workflow of exercises
  4.7-4.9 has an equivalent built in.

## Why OpenShift is strong, and where it loses here

- **Batteries included.** Routes, internal registry, builds, SSO, monitoring and logging ship in the
  box; with Rancher most of that is assembled from separate projects (as this course did with
  Prometheus, Loki, Grafana and ArgoCD).
- **Stronger default security posture.** SecurityContextConstraints and the restricted-v2 policy are
  enforced out of the box, which prevents the "run as root because it works" habits that our small
  manifests still have (the nginx and postgres images run as their own users only by convention).
- **Support and compliance.** Red Hat backing, certified operators and a predictable upgrade path
  matter in regulated environments; Rancher's ecosystem is broader but less uniformly certified.
- **Cost and footprint are the deciding factors here.** OpenShift's minimum cluster is measured in
  several large nodes; our project is two services and a database.

## Where the decision would flip

If this were a bank with an existing Red Hat contract, an audit requirement for a certified
platform and a team that does not want to operate the monitoring stack, OpenShift's integrated
tooling and support would be worth the licence. For a course project and for a small team already
running k3s, Rancher costs nothing and removes a migration.
