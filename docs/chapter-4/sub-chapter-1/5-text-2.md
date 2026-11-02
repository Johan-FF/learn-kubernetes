New kid in the block: Gateway API
For years, Ingress has been the primary solution for external traffic routing in Kubernetes. The situation is changing, the new Gateway API offers a next-generation solution for routing.

The Gateway API is a set of resources and standards that allow you to define how external traffic should be routed to services within your Kubernetes cluster. It builds on the ingress concept but offers more advanced features, making it easier to handle complex routing and traffic management scenarios.

In order to use the Gateway API, we should enable it to our cluster:


gcloud container clusters update dwk-cluster --location=europe-north1-b --gateway-api=standard
Note that the dwk-cluster is the cluster name. You can find it as follows:


$ gcloud container clusters list
NAME         LOCATION         MASTER_VERSION      MASTER_IP      MACHINE_TYPE  NODE_VERSION        NUM_NODES
dwk-cluster  europe-north1-b  1.36.0-gke.1759000  35.228.199.94  e2-small      1.36.0-gke.1759000  3
The command takes some time so be patient!

Gateway API has some more parts to configure compared to Ingress:

Add alt
At the top is GatewayClass, which is a resource within the GatewayAPI that defines a type of Gateway. It specifies the underlying infrastructure or controller that will be used to implement the Gateway. The GatewayClass resources are defined by infrastructure providers. The list of options provided by Google Kubernetes Engine can be seen here.

Our work begins by defining the Gateway, which defines where and how the load balancers listen for traffic to our cluster. It is configured based on a GatewayClass that, amongst other things, selects the load balancer type to use. The Gateway specifies details like which IP addresses or hostnames to listen on, which ports to use:

Our gateway in file gateway.yaml looks the this:


apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
spec:
  gatewayClassName: gke-l7-global-external-managed
  listeners:
  - name: http
    protocol: HTTP
    port: 80
    allowedRoutes:
      kinds:
      - kind: HTTPRoute
Our definition is pretty simple; it picks a GatewayClass following the Google recommendations and says that our cluster accepts HTTP traffic to port 80.

The gateway just defines where and how the load balancers listen for traffic. The routing rules can be defined with HTTPRoute resources. The file route.yaml looks like the following:


apiVersion: gateway.networking.k8s.io/v1beta1
kind: HTTPRoute
metadata:
  name: my-route
spec:
  parentRefs:
  - name: my-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /
    backendRefs:
    - name: seedimage-svc
      port: 80
So the rule looks quite much like the route definition in the Ingress configuration. It just says that requests to the path / are routed to service seedimage-svc. It also has parentRefs that point to the Gateway resource where it belongs.

We still need to change the Service port type to ClusterIP:


apiVersion: v1
kind: Service
metadata:
  name: seedimage-svc
spec:
  type: ClusterIP
  selector:
    app: seedimage
  ports:
    - port: 80
      protocol: TCP
      targetPort: 3000
The gateway objects tells us the IP address of the cluster:


$ kubectl get gateway my-gateway
NAME         CLASS         ADDRESS          PROGRAMMED   AGE
my-gateway   gke-l7-gxlb   35.227.224.141   True         106m
We can verify that the app works in http://35.227.224.141. Note that it could take some time until the gateway is set up and the IP starts responding. The command kubectl describe gateway my-gateway is also helpful.

Ingress and nowadays the Gateway help us define a load balancer as GCP understands them. In other words, we write YAML files, which then get read by GCP, and the actual infrastructure is provisioned by their automation. When using either resource in a cloud environment, it's wise to read through the cloud service provider's documentation.

You can also confirm details about the load balancers we just created by going to the GCP UI and searching for load balancer resources or by running `gcloud compute url-maps list`. If you're wondering why we're listing "url-maps", or what GCP load balancers are made of, including forwarding-rules and target proxies, you can learn more here.

Add alt