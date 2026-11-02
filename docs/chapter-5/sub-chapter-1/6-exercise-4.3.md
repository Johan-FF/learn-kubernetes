4.3. Prometheus
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Ok, we started up Prometheus in Chapter 3, but we have barely scratched the surface. Let's do a single hands-on query to learn more.

Start now Prometheus with Helm, and use port-forward to access the GUI website.

This time, we will do the port forwarding through the service:

Highlighted lines: 7, 9
$ kubectl -n monitoring get svc
NAME                            TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
grafana                         ClusterIP   34.118.228.120   <none>        80/TCP     159m
prom-kube-state-metrics         ClusterIP   34.118.239.99    <none>        8080/TCP   160m
prom-prometheus-node-exporter   ClusterIP   34.118.236.155   <none>        9100/TCP   160m
prom-prometheus-pushgateway     ClusterIP   34.118.239.144   <none>        9091/TCP   160m
prom-prometheus-server          ClusterIP   34.118.230.12    <none>        80/TCP     160m

$ kubectl port-forward svc/prom-prometheus-server -n monitoring 9090:80
Forwarding from 127.0.0.1:9090 -> 9090
Forwarding from [::1]:9090 -> 9090
Handling connection for 9090
Handling connection for 9090
And now accessing http://localhost:9090(opens in a new tab) will allow us to write queries.

Write a query that shows the number of pods created by StatefulSets in prometheus namespace. For the above setup the Value should be 3 different pods:(opens in a new tab)

Add alt
Query for "kube_pod_info" should have the required fields to filter through. See documentation(opens in a new tab) for help with querying.

