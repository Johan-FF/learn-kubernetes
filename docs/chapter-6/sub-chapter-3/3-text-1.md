Going through the Istio example app shows nicely some of the available features, but does not really enlighten you how to set up Istio ambient for your own app. So let us go through a very simple example.

Let us now deploy a hello world app to the default namespace where Istio is already enabled. Deployment and Service are defined as follows:


apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-dep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello
  template:
    metadata:
      labels:
        app: hello
    spec:
      containers:
        - name: seedimage
          image: mluukkai/hello:1

---

apiVersion: v1
kind: Service
metadata:
  name: hello-svc
spec:
  type: ClusterIP
  selector:
    app: hello
  ports:
    - port: 80
      protocol: TCP
      targetPort: 8080
Gateway and HTTPRoute definition is straightforward:


apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: hello-gateway
spec:
  gatewayClassName: istio
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: Same

---

apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: hello
spec:
  parentRefs:
  - name: hello-gateway
  rules:
  - matches:
    - path:
        type: Exact
        value: /
    backendRefs:
    - name: hello-svc
      port: 80
After we have generated some traffic to the app, we can already visualise it with Kiali:

Add alt
As we can see, the triangle represents the service, and the rounded box on the right is the pod. Arrows represent the HTTP and TCP traffic in the mesh.

Let us now change our setup to a canary deployment. We define deployment and service of the old version and new version as follows:


apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-dep-v1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello
      version: v1
  template:
    metadata:
      labels:
        app: hello
        version: v1
    spec:
      containers:
        - name: seedimage
          image: mluukkai/hello:1

---

apiVersion: v1
kind: Service
metadata:
  name: hello-svc-v1
spec:
  type: ClusterIP
  selector:
    app: hello
    version: v1
  ports:
    - port: 80
      protocol: TCP
      targetPort: 8080

---

apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-dep-v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello
      version: v2
  template:
    metadata:
      labels:
        app: hello
        version: v2
    spec:
      containers:
        - name: seedimage
          image: mluukkai/hello:2

--- 

apiVersion: v1
kind: Service
metadata:
  name: hello-svc-v2
spec:
  type: ClusterIP
  selector:
    app: hello
    version: v2
  ports:
    - port: 80
      protocol: TCP
      targetPort: 8080
Note how the label version is used to distinguish between the versions! We can now just change the HTTPRoute resource to split the traffic between the services:


apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: hello
spec:
  parentRefs:
  - name: hello-gateway
  rules:
  - matches:
    - path:
        type: Exact
        value: /
    backendRefs:
    - name: hello-svc-v1
      port: 80
      weight: 75
    - name: hello-svc-v2
      port: 80
      weight: 25
Kiali visualizes this nicely, and after generating some traffic we can check that what is the ratio each pod gets:

Add alt
Both the ambient mode and the Gateway resource are pretty recent, and the Istio documentation is lagging a bit behind. It can be partly confusing since it does not always make clear whether the examples are valid for the ambient mode. E.g., you find quite many references to the VirtualService resource, but as mentioned here

Usage of VirtualService with the ambient data plane mode is considered Alpha. Mixing with Gateway API configuration is not supported, and will lead to undefined behavior.

There are some interesting traffic management operations that are not available with the new tools yet and require the use of the older VirtualService resource. Fortunately, we can use VirtualServices if we switch from the Gateway API to Istio Ingress Gateway resource.

Firstly, we must install the Ingress Gateway by following the documentation. Then we can replace the Kubernetes Gateway and HTTPRoute with Istio Gateway and VirtualService resources:


apiVersion: networking.istio.io/v1
kind: Gateway
metadata:
  name: hello-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"

---

apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: helloworld
spec:
  hosts:
  - "*"
  gateways:
  - hello-gateway
  http:
  - match:
    - uri:
        exact: /
    route:
    - destination:
        host: hello-svc-v1
        port:
          number: 80
      weight: 50
    - destination:
        host: hello-svc-v2
        port:
          number: 80
      weight: 50
Note that the Gateway now has the API version networking.istio.io/v1 while the previous Kubernetes Gateway had the API version gateway.networking.k8s.io/v1 so, despite both having the kind Gateway, those are completely different resources that are not at all compatible with each other.

We can access our app by making a port-forward throught the Istio ingress-gateway:


kubectl port-forward svc/istio-ingressgateway 8080:80 -n istio-ingress
The definition of VirtualService is quite similar to the HTTPRoute, just the syntax (see here for more) is a bit different. One interesting feature that is available when using VirtualService is the fault injection, which we can use to simulate various kinds of error conditions. The following defines that there is a 50% chance that the response is delayed by 3 seconds and a 25% chance that the request is aborted with HTTP 500 error:


apiVersion: networking.istio.io/v1
kind: VirtualService
metadata:
  name: helloworld
spec:
  hosts:
  - "*"
  gateways:
  - hello-gateway
  http:
  - match:
    - uri:
        exact: /
    route:
    - destination:
        host: hello-svc-v1
        port:
          number: 80
      weight: 50
    - destination:
        host: hello-svc-v2
        port:
          number: 80
      weight: 50
    fault:
      delay:
        percentage:
          value: 50
        fixedDelay: 3s
      abort:
        httpStatus: 500
        percentage:
          value: 25
Should one use Kubernetes Gateway API or the Istio Gateway? I'd pick the first one if it provides all the needed features, since it is the standard. Only if you really need VirtualServices for failure injection, ArgoRollouts (that at the moment seem to require the use of VirtualServices) or something else, then you may fall back to the Istio Gateway.