# argocd

GitOps setup for exercises 4.7-4.9. ArgoCD watches this repository and reconciles the cluster
towards what the repository says.

## Install

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deployment/argocd-server
```

The repository is public, so ArgoCD clones it without credentials.

## Applications

| File | What it manages | Exercise |
| --- | --- | --- |
| `application-log-output.yaml` | `log_output/manifests` in the `exercises` namespace | 4.7 |
| `application-project.yaml` | `project/overlays/local` in the `project` namespace | 4.8 |
| `application-staging.yaml` | `project/overlays/staging`, tracks `main` | 4.9 |
| `application-production.yaml` | `project/overlays/production`, tracks the newest release tag | 4.9 |

All of them use `syncPolicy.automated` with `prune` and `selfHeal`, so a manual `kubectl edit` is
reverted and deleting a file in Git deletes the resource.

```bash
kubectl apply -f argocd/
kubectl -n argocd get applications
```

## UI

```bash
kubectl -n argocd port-forward svc/argocd-server 8088:443
```

The initial admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```
