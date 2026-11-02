Using the Gateway API in the k3d cluster
Gateway API does not currently work in k3d cluster out of the box, but you can make it work.

Gateway API is only a Kubernetes API specification. To actually handle traffic, you must install a Gateway implementation. There are many implementation options, for example, Envoy Gateway, NGINX Gateway Fabric, and Kong.

One good selection is Envoy Gateway because it has strong Gateway API support, clear installation for local clusters, and predictable behavior for path-based routing demos.

To get the Gateway working, you must install the cluster with the Traefik proxy disabled:


k3d cluster create --agents 2 -p 8081:80@loadbalancer --port 8082:30080@agent:0 --k3s-arg '--disable=traefik@server:0'
Next step is to install Envoy. We opt here for the yaml based installation:


kubectl apply --server-side -f https://github.com/envoyproxy/gateway/releases/latest/download/install.yaml
kubectl -n envoy-gateway-system rollout status deployment/envoy-gateway --timeout=180s
When you now define a gateway as follows:

Highlighted lines: 6, 10
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
spec:
  gatewayClassName: eg
  listeners:
    - name: http
      protocol: HTTP
      port: 80

You can access the app root at the address http://localhost:8081, since in your k3d cluster the host port 8081 maps to the cluster load balancer port 80 and Envoy Gateway receives traffic on that path.