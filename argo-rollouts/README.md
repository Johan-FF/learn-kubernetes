# argo-rollouts (exercise 4.4)

Canary deployment for the "Ping-pong" application that is automatically reverted when the CPU usage
of the namespace goes above a threshold during the analysis window.

## Components

| File | Purpose |
| --- | --- |
| `rollout.yaml` | Replaces the ping-pong Deployment with an Argo `Rollout`: 50% canary, then a five-minute analysis, then a manual pause |
| `analysistemplate.yaml` | Job-based metric that sums the CPU usage of every container in the `exercises` namespace and fails when it exceeds `cpu_limit_millicores` |
| `rbac.yaml` | ServiceAccount, Role and RoleBinding that let the analysis job read pods and `metrics.k8s.io` |

## How the analysis works

The job calls `kubectl top pods -n exercises`, sums the CPU column into millicores and exits
non-zero when the total is above the limit:

```
namespace exercises is using 22m, limit 1m
over the limit, failing the analysis
```

`interval: 30s` with `count: 10` means ten samples over five minutes, and `failureLimit: 1` aborts
the rollout at the first failing sample. `successCondition` is not used: the exit code of the job
is the verdict.

The threshold defaults to `150` millicores (the namespaced workloads idle at 10-25m) and the
rollout passes it explicitly in the step args, so it can be tuned per release.

## Verified behaviour

1. With the limit set to `1m`, a new revision started the canary and the first sample failed:

```
NAME                            STATUS
ping-pong-dep-699954ff99-7-1    Failed
```

```
Degraded | RolloutAborted: Rollout aborted update to revision 7: Step-based analysis phase
error/failed: Metric "namespace-cpu" assessed Failed due to failed (2) > failureLimit (1)
```

The stable ReplicaSet stayed in place and kept serving `ping_pong:4.4`; the bad revision was never
promoted.

2. With the limit restored to `150m`, a new revision runs the analysis and moves on to the pause
step, which is the manual gate before the last 50% of traffic is moved.

## Apply

```bash
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts --server-side -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
kubectl apply -f argo-rollouts/
kubectl get rollout,analysisrun -n exercises
```

`metrics-server` must be running in the cluster for `kubectl top` to answer.
