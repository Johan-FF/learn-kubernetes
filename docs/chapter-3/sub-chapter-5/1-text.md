Monitoring
What you'll learn in this page
The wide array of tools used for monitoring and logging
Helm, the package manager for Kubernetes
So far, we've deployed workloads without much visibility into what's actually happening inside the cluster. This section adds observability to the setup. With it, we can verify that things are working as expected, catch issues earlier, and troubleshoot with real data rather than guesswork.

The setup
The monitoring stack has four components, each with a distinct role:

Prometheus collects and stores various cluster metrics over time, enabling graphs, rates, and trends.
Loki collects and stores container logs, making them searchable from a central place.
Alloy (k8s-monitoring) automatically collects pod logs from the node filesystem and forwards them to Loki.
Grafana visualizes both metrics and logs through dashboards and ad-hoc queries.
So, the relationship of the components looks like this:

Add alt
Installation
Before we can get started, let's look into how Kubernetes applications are managed more easily with Helm(opens in a new tab), the package manager for Kubernetes. Helm uses a packaging format called charts to define the dependencies of an application. Among other things, Helm charts include information for the version of the chart, the requirements of the application, such as the Kubernetes version, as well as other charts that it may depend on.

Installation instructions for Helm are found here(opens in a new tab).

Helm charts are hosted in remote repositories, much like Docker images on Docker Hub. Before Helm can download a chart, you need to register its repository. Let us run the following commands to add the Prometheus and Grafana repositories and refresh our local index:


helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
Let us then create a separate namespace for all the monitoring related resources:


kubectl create namespace monitoring
Value files
Helm charts ship with sensible defaults, but they're designed for many use cases. A Helm values file is how you customize a chart for your specific situation. For our monitoring stack, we disable alerting, use single-instance deployments, and avoid remote storage to keep resource use low.

We simplify the Prometheus setup in prom-values.yaml by disabling alerting and remote metric forwarding. We also set that metrics are collected and stored locally only:


alertmanager:
  enabled: false

pushgateway:
  enabled: false

server:
  remoteWrite: []
The Loki setup in loki-values.yaml is tweaked by running it as a single instance with local filesystem storage. Distributed components and replication are disabled, keeping the configuration minimal:


deploymentMode: SingleBinary

singleBinary:
  replicas: 1

backend:
  replicas: 0
read:
  replicas: 0
write:
  replicas: 0

loki:
  commonConfig:
    replication_factor: 1
  storage:
    type: filesystem
  useTestSchema: true
We configure Alloy in k8smon-values.yaml to collect pod logs from the node filesystem and forward them to the local Loki instance. Logs are tagged with the cluster name (that is set to my-cluster), and self-reporting is disabled:


cluster:
  name: my-cluster

destinations:
  localLoki:
    type: loki
    url: http://loki-gateway.monitoring.svc.cluster.local/loki/api/v1/push
    tenantId: "1"

podLogsViaLoki:
  enabled: true
  collector: alloy-singleton

collectors:
  alloy-singleton:
    presets: [filesystem-log-reader]

selfReporting:
  enabled: false
Finally we configure Grafana in grafana-values.yaml with Prometheus and Loki pre-wired as datasources, so both are available immediately after deployment without any manual setup:


adminPassword: admin

datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        access: proxy
        url: http://prom-prometheus-server
        isDefault: true
      - name: Loki
        type: loki
        access: proxy
        url: http://loki-gateway.monitoring.svc.cluster.local
        jsonData:
          httpHeaderName1: X-Scope-OrgID
        secureJsonData:
          httpHeaderValue1: "1"
Installing the charts
We are now ready for the installation. It should be noted that Alloy needs Loki up and running before it can forward logs, and Grafana needs both Prometheus and Loki available before it can configure its datasources. Installing in the wrong order leads to errors and failed connections.

We follow the natural dependency order. Metric and log storage that is Prometheus and Loki first, then Alloy to start collecting and forwarding logs, and finally Grafana once both data sources are in place:


helm upgrade --install prom prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace \
  --values prom-values.yaml

helm upgrade --install loki grafana/loki \
  --namespace monitoring \
  --values loki-values.yaml

helm upgrade --install k8smon grafana/k8s-monitoring \
  --namespace monitoring \
  --values k8smon-values.yaml

helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --values grafana-values.yaml
Helm schedules pods, but they take time to pull images and start. Run the following to confirm everything is up before proceeding:


helm list --namespace monitoring
kubectl get svc --namespace monitoring
kubectl get pods --namespace monitoring
We'll wait until all four releases (prom, loki, k8smon, grafana) show pods in Running state.

Intallation added a lot of stuff to our cluster. Among other things, it added a number of custom resources(opens in a new tab). They are a way to extend the Kubernetes APIs to offer new resources that Kubernetes doesn't support out of the box. We will be designing our own custom resources in Chapter 6.

You can remove almost anything with helm delete [name] with the name found using the command helm list --namespace monitoring. Custom resource definitions are left and have to be manually removed if the need arises. The definitions don't do anything by themselves, so leaving them does no harm.

Grafana
We are now ready to see the logs and metrics with the Grafana user interface that has a Kubernetes service endpoint svc/grafana in our cluster. Let us set up a port forward to the service:


kubectl port-forward --namespace monitoring svc/grafana 3000:80
We can now access http://localhost:3000(opens in a new tab) with a browser and use the credentials admin / admin to log in.

In the Explore view, we can select either Prometheus or Loki as the datasource.

Let us first pick Prometheus, switch to code mode and define a query count(kube_pod_info):

Add alt
We can see that the current total number of pods in the cluster is around 29. We could break this down further:


count by (namespace) (kube_pod_info)
This groups the kube_pod_info metric by namespace and counts the results, giving a per-namespace pod breakdown. Queries are specified with PromQL, the Prometheus Query Language. The cluster exposes hundreds of metrics out of the box, covering pods, nodes, containers, and more.

Let us now try the Loki datasource. We'll again use the code mode and use a query {namespace="default"}. The result looks like this:

Add alt
Loki uses LogQL, its own query language for filtering and searching logs. A basic query selects logs by label. As one could guess, the query


{namespace="default"}
returns all logs from pods running in the default namespace. Labels in Loki correspond to metadata attached when logs are collected. Besides the namespace, e.g., the pod and service name are available:

Add alt
Queries could be filtered further by log content. For example, the following query


{namespace="default"} |= "error"
would narrow the results to lines containing the word error. There are no such lines when running the redisfiller app. LogQL also supports log parsing, pattern matching, and metric queries derived from log content, for example, counting error rates over time.

Monitoring in production
We now have a fully functional monitoring stack using the same tools and patterns found in real production environments.

In production, this setup would be extended in a few key areas. Prometheus and Loki would run with multiple replicas and persistent volumes to survive pod failures. Local filesystem storage would be replaced with a storage that persists data across restarts. All the endpoints would be secured with encrypted credentials, RBAC, network policies, and TLS. Retention policies would be defined to retain metrics for weeks and logs for days, helping manage storage costs over time. Alertmanager would be enabled with alert rules that notify us when something breaks. Finally, log collection would be distributed across nodes, one Alloy pod per node, rather than a single collector.