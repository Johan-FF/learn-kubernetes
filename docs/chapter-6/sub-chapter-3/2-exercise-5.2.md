5.2. Getting started with Istio service mesh
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Read now the following

https://istio.io/latest/docs/overview/what-is-istio/
https://istio.io/latest/docs/overview/dataplane-modes/
https://istio.io/latest/docs/ambient/overview/
Install Istio CLI https://istio.io/latest/docs/ambient/getting-started/

Setup Istio to your k3d cluster https://istio.io/latest/docs/ambient/install/platform-prerequisites/#k3d

Deploy the Sample app https://istio.io/latest/docs/ambient/getting-started/deploy-sample-app/ and follow the steps until Clean up.
Note that you need to have Prometheus installed in your cluster. You most likely need to set the Prometheus URL in the file kiali.yaml as follows

Highlighted lines: 3
prometheus:
  enabled: true
  url: http://prom-prometheus-server.monitoring:80
assuming you have installed Prometheus to the monitoring namespace :

Highlighted lines: 7
$ kubectl get svc -n monitoring
NAME                            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
grafana                         ClusterIP   10.43.132.92    <none>        80/TCP     15m
prom-kube-state-metrics         ClusterIP   10.43.21.157    <none>        8080/TCP   15m
prom-prometheus-node-exporter   ClusterIP   10.43.191.103   <none>        9100/TCP   15m
prom-prometheus-pushgateway     ClusterIP   10.43.108.188   <none>        9091/TCP   15m
prom-prometheus-server          ClusterIP   10.43.98.196    <none>        80/TCP     15m