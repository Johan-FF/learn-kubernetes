# Istio service mesh (exercises 5.2 and 5.3)

Ambient mode: no sidecars, `ztunnel` handles L4 for the pods of an enrolled namespace and optional
waypoint proxies handle L7.

## 5.2 Getting started

```bash
# istioctl
curl -L https://github.com/istio/istio/releases/download/1.28.4/istio-1.28.4-win.zip -o istio.zip

# the mesh itself
istioctl install --set profile=ambient --skip-confirmation

# metrics for Kiali
helm upgrade --install prom prometheus-community/prometheus -n monitoring \
  --values infra/monitoring/prom-values.yaml

# Kiali, configured to read the Prometheus service above
kubectl apply -f istio/kiali.yaml

# the sample application, enrolled in the mesh
kubectl create namespace bookinfo
kubectl label namespace bookinfo istio.io/dataplane-mode=ambient
kubectl apply -n bookinfo -f istio/bookinfo.yaml
```

### k3d gotcha

`istio-cni-node` stays in `Init`/`NotReady` with

```
no networks found in /host/etc/cni/net.d
```

because k3s keeps its CNI configuration in `/var/lib/rancher/k3s/agent/etc/cni/net.d` and the
`/etc/cni/net.d` directory the Istio CNI plugin mounts is empty. Copying the k3s conflist into the
mounted directory fixes the chained plugin detection, and the CNI and ztunnel DaemonSets become
ready:

```bash
for n in k3d-devops-server-0 k3d-devops-agent-0; do
  docker exec "$n" sh -c 'cp /var/lib/rancher/k3s/agent/etc/cni/net.d/*.conflist /etc/cni/net.d/'
done
kubectl -n istio-system delete pod -l k8s-app=istio-cni-node
```

### Verified

- `kubectl -n bookinfo get pods`: six `Running` pods.
- `curl` through a port-forward to `productpage` returns `200` and the "Book Details" table, which
  means productpage talks to details and reviews through the mesh.
- `istioctl ztunnel-config workloads` lists the enrolled pods.
- Kiali answers on `/kiali/` (port-forward `svc/kiali 20001:20001`) and uses
  `http://prom-prometheus-server.monitoring:80` as its Prometheus.

## 5.3 Log app in the mesh with a greeter

`greeter/` is a small service that answers `hello from <version>`. Two Deployments (`greeter-v1`,
`greeter-v2`) are behind two Services (`greeter-svc-1`, `greeter-svc-2`), and the parent
`greeter-svc` carries an `HTTPRoute` with a 75/25 split:

```yaml
backendRefs:
  - name: greeter-svc-1
    port: 2345
    weight: 75
  - name: greeter-svc-2
    port: 2345
    weight: 25
```

The "Log output" reader calls `http://greeter-svc:2345/` and appends the greeting to its output:

```
file content: this text is from file
env variable: MESSAGE=hello world
2026-11-08T...: <hash>
Ping / Pongs: 3
Greetings: hello from v1
```

```bash
kubectl label namespace exercises istio.io/dataplane-mode=ambient
kubectl apply -f greeter/manifests/
kubectl apply -f log-output/deployment.yaml
kubectl -n exercises port-forward deployment/log-output-dep 8094:3000
```

The split is visible in Kiali's graph for the `greeter-svc` node, and by repeating requests to
`/` and counting the `hello from v1` / `hello from v2` lines.
