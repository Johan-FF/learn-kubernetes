# infra/monitoring

Helm values for the observability stack used from exercise 2.10 onwards: Prometheus for metrics,
Loki for logs, Alloy (`k8s-monitoring`) to ship pod logs into Loki, and Grafana to query both.

## Install

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

helm upgrade --install prom prometheus-community/prometheus -n monitoring --values infra/monitoring/prom-values.yaml
helm upgrade --install loki grafana/loki -n monitoring --values infra/monitoring/loki-values.yaml
helm upgrade --install k8smon grafana/k8s-monitoring -n monitoring --values infra/monitoring/k8smon-values.yaml
helm upgrade --install grafana grafana/grafana -n monitoring --values infra/monitoring/grafana-values.yaml
```

The order matters: Loki must exist before Alloy starts shipping logs, and Grafana needs both
datasources reachable when it starts.

## Open Grafana

```bash
kubectl port-forward -n monitoring svc/grafana 3000:80
```

`http://localhost:3000`, credentials `admin` / `admin`.

Datasources:

- Prometheus: `count by (namespace) (kube_pod_info)`
- Loki: `{namespace="project"} |= "rejected"`
