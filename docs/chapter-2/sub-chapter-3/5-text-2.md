What is an Ingress?
There's yet additional resource that will help us with serving the application, Ingress.

Incoming Network Access resource Ingress(opens in a new tab) is a completely different type of resource from Services. If you've got your OSI model(opens in a new tab) memorized, it works in layer 7 while services work on layer 4. You could see these used together: first the aforementioned LoadBalancer and then Ingress to handle routing. In our case, as we don't have a load balancer available we can use the Ingress as the first stop. If you're familiar with reverse proxies like Nginx, Ingress should seem familiar.

Ingresses are implemented by various different "controllers". This means that ingresses do not automatically work in a cluster, but give you the freedom of choosing which Ingress controller works for you the best. K3s has Traefik(opens in a new tab) installed already. Other options include Istio and Nginx Ingress Controller, more here(opens in a new tab).

Switching to Ingress will require us to create an Ingress resource. Ingress will route incoming traffic forward to a Service, but the old NodePort Service won't do so we will remove it:


$ kubectl delete -f manifests/service.yaml
  service "hashresponse-svc" deleted
A ClusterIP(opens in a new tab) type Service resource gives the Service an internal IP that'll be accessible within the cluster.

The following service.yaml definition will let TCP traffic from port 2345 to port 3000:


apiVersion: v1
kind: Service
metadata:
  name: hashresponse-svc
spec:
  type: ClusterIP
  selector:
    app: hashresponse
  ports:
    - port: 2345
      protocol: TCP
      targetPort: 3000
The second resource we need is the new Ingress, that shall be defined in file ingress.yaml.

Declare that it should be an Ingress
Route all traffic to our service
Configuration looks like this:


apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dwk-material-ingress
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: hashresponse-svc
            port:
              number: 2345
Then we can apply everything and view the result


$ kubectl apply -f manifests
  ingress.networking.k8s.io/dwk-material-ingress created
  service/hashresponse-svc configured

$ kubectl get svc,ing
  NAME                       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
  service/kubernetes         ClusterIP   10.43.0.1    <none>        443/TCP    5m22s
  service/hashresponse-svc   ClusterIP   10.43.0.61   <none>        2345/TCP   45s

  NAME                                             CLASS    HOSTS   ADDRESS                            PORTS   AGE
  ingress.networking.k8s.io/dwk-material-ingress   <none>   *       172.21.0.3,172.21.0.4,172.21.0.5   80      16s
We can see that the Ingress is listening on port 80. As we already opened the port there we can access the application on http://localhost:8081(opens in a new tab).

The flow of traffic when accessing the app is now the following:


http://localhost:8081/
         ↓
  [Ingress Controller] (port 8081 mapped from host)
         ↓
  [Ingress Rules] (path: / → hashresponse-svc:2345)
         ↓
  [Service] (port 2345 → targetPort 3000)
         ↓
  [Pod] (container listening on port 3000)
         ↓
  [Application]