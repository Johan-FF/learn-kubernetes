# Monitoring queries

Hands-on queries used for exercises 2.10 and 4.3, with the results observed on this cluster.

## Open Prometheus

```bash
kubectl port-forward -n monitoring svc/prom-prometheus-server 9090:80
```

`http://localhost:9090` → Graph → query below.

## 4.3 Pods created by StatefulSets in the monitoring namespace

```promql
count(kube_pod_info{namespace="monitoring", created_by_kind="StatefulSet"})
```

Observed value: `1`.

```promql
kube_pod_info{namespace="monitoring", created_by_kind="StatefulSet"}
```

Observed series: `pod="loki-0"`, `created_by_name="loki"`.

The course example shows `3` because the default Loki chart in the material also runs the
`chunks-cache` and `results-cache` memcached StatefulSets. In this repository those two caches are
disabled in `loki-values.yaml`: they do not fit next to the rest of the workloads on a single-node
k3d cluster and they are not needed at this scale. `loki-0` is therefore the only StatefulSet pod
in `monitoring`.

## 2.10 Rejected todos in the logs

```bash
kubectl port-forward -n monitoring svc/grafana 3000:80
```

Grafana → Explore → Loki datasource:

```logql
{namespace="project"} |= "rejected"
```

Observed line:

```
rejected todo: 141 characters, limit is 140: "yyyyy..."
```

The same query can be run against the Loki gateway without Grafana:

```bash
kubectl port-forward -n monitoring svc/loki-gateway 3100:80
curl -H "X-Scope-OrgID: 1" \
  'http://127.0.0.1:3100/loki/api/v1/query_range?query=%7Bnamespace%3D%22project%22%7D%20%7C%3D%20%22rejected%22&limit=5'
```

## 4.3 / Chapter 3 Pod count per namespace

```promql
count by (namespace) (kube_pod_info)
```
