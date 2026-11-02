From Service to Ingress
Services are quite simple. They allow us to define a layer 4 (L4) load balancer on Google Cloud Services. Layer 4 here means the layer in OSI model. In other words, TCP/UDP traffic. For advanced traffic rules, we need to use a layer 7 (L7) load balancers which can be created either by an Ingress, or by Gateway resources which we'll talk a little bit more about later.

Let's try using the Ingress resource first.

NodePort type service is required with an Ingress in GKE. Even though it is NodePort, GKE does not expose it outside the cluster. Let's test this by continuing with the previous example. Change service.yaml as follows:

Highlighted lines: 6
apiVersion: v1
kind: Service
metadata:
  name: seedimage-svc
spec:
  type: NodePort
  selector:
    app: seedimage
  ports:
    - port: 80
      protocol: TCP
      targetPort: 3000
Ingress in file ingress.yaml contains no surprises:


apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: seedimage-ing
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: seedimage-svc
            port:
              number: 80
When you have applied those you can view the port from the list of ingresses:


$ kubectl get ing
  NAME            CLASS    HOSTS   ADDRESS         PORTS   AGE
  seedimage-ing   <none>   *       34.120.61.234   80      2m13s
Now the address here will be the way to access the application. This will take a moment to deploy, responses may be 404 and 502 as it becomes available. The Ingress performs health checks by GET requesting / and expects an HTTP 200 response.