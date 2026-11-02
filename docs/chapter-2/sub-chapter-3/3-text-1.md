Connecting to an app inside a Docker container is easy. If you have an app listening to port 3000, you can just use docker run with the flag -p 3003:3000. Another option is to use Docker Compose ports declaration. Unfortunately, Kubernetes isn't as simple. We're going to use either a Service resource, an Ingress resource, or the most recent solution, the Gateway API.

Initial setup
Because we are running our cluster inside Docker with k3d we will have to do some preparations.

Opening a route from outside of the cluster to the pod will not be enough if we have no means of accessing the k3d cluster inside the Docker containers! Let us see what the default setup looks like:


$ docker ps
  CONTAINER ID    IMAGE                      COMMAND                  CREATED             STATUS              PORTS                             NAMES
  b60f6c246ebb    ghcr.io/k3d-io/k3d-proxy:5 "/bin/sh -c nginx-pr…"   2 hours ago         Up 2 hours          80/tcp, 0.0.0.0:58264->6443/tcp   k3d-k3s-default-serverlb
  553041f96fc6    rancher/k3s:latest         "/bin/k3s agent"         2 hours ago         Up 2 hours                                            k3d-k3s-default-agent-1
  aebd23c2ef99    rancher/k3s:latest         "/bin/k3s agent"         2 hours ago         Up 2 hours                                            k3d-k3s-default-agent-0
  a34e49184d37    rancher/k3s:latest         "/bin/k3s server --t…"   2 hours ago         Up 2 hours                                            k3d-k3s-default-server-0
We see that k3d has helpfully prepared port 58264 to access the Kubernetes API via the load balancer, which proxies requests to port 6443 on the server node. Additionally, port 80 is open on the load balancer. All requests to the load balancer will be proxied to the server node of the cluster.

As we see, our cluster currently has one server node and two agent nodes. For testing purposes, we'll also want an individual port open for a single agent node. Let's delete our old cluster and create a new one with specific ports open for easier access and testing.

K3d documentation(opens in a new tab) tells us how the ports are opened, we'll open local 8081 to 80 in k3d-k3s-default-serverlb and local 8082 to 30080 in k3d-k3s-default-agent-0. The 30080 is chosen almost completely randomly, but needs to be a value between 30000-32767 for the next step:


$ k3d cluster delete
  INFO[0000] Deleting cluster 'k3s-default'
  ...
  INFO[0002] Successfully deleted cluster k3s-default!

$ k3d cluster create --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2
  INFO[0000] Created network 'k3d-k3s-default'
  ...
  INFO[0021] Cluster 'k3s-default' created successfully!
  INFO[0021] You can now use it like this:
  kubectl cluster-info

$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app2/manifests/deployment.yaml
  deployment.apps/hashresponse-dep created
Above the "agent:0" and "loadbalancer" are based on k3d documentation(opens in a new tab) and reading code from here(opens in a new tab) and here(opens in a new tab).

Now we have access through port 8081 to our server node (actually all nodes) and 8082 to one of our agent nodes port 30080. They will be used to showcase different methods of communicating with the servers.

Limitations of local environment
The setup isn't perfect, we will have a limited amount of ports available in the future. This will be sufficient for our use cases.

Your OS may support using the host network so no ports need to be opened. However, I have no experience with this.

What is a Service?
The deployment resources managed the deployment process for us, handling the creation of the pods. Given that the application's pods are ephemeral and can be created or terminated at any moment, communication with the application must not rely on the presence of any specific pod.

Service resources are essential for managing the application's accessibility, ensuring that it can be reached by connections originating both outside the cluster and from within. These resources handle the routing and load balancing necessary to maintain seamless communication with the application, regardless of the dynamic nature of pod creation and termination.

After recreation of the cluster, we should create again also our example application:


kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app2/manifests/deployment.yaml
The deployment.yaml looks as follows


apiVersion: apps/v1
kind: Deployment
metadata:
  name: hashresponse-dep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hashresponse
  template:
    metadata:
      labels:
        app: hashresponse
    spec:
      containers:
        - name: hashresponse
          image: jakousa/dwk-app2:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
Let us now create a file service.yaml into the manifests folder. We need the service to do the following things:

Declare that we want a Service
Declare which port to listen to
Declare the application where the request should be directed to
Declare the port where the request should be directed to
The resulting file service.yaml looks like this:


apiVersion: v1
kind: Service
metadata:
  name: hashresponse-svc
spec:
  type: NodePort
  selector:
    app: hashresponse # This is the app as declared in the deployment.
  ports:
    - name: http
      nodePort: 30080 # This is the port that is available outside. Value for nodePort can be between 30000-32767
      protocol: TCP
      port: 1234 # This is a port that is available to the cluster, in this case it can be ~ anything
      targetPort: 3000 # This is the target port

$ kubectl apply -f manifests/service.yaml
  service/hashresponse-svc created
As we've published 8082 as 30080 we can access it now via http://localhost:8082(opens in a new tab).

We've now defined a service with type: NodePort. NodePorts(opens in a new tab) are simply ports that are opened by Kubernetes to all of the nodes and the service will handle requests in that port. NodePorts are not flexible and require you to assign a different port for every application. As such NodePorts are not used in production but are helpful to know about.

What we'd want to use instead of NodePort would be a LoadBalancer type service but this "only" works with cloud providers as it configures a, possibly costly, load balancer for it. We'll get to know them in Chapter 4.

Let us go once more through the configuration of the example app:

Deployment (hashresponse-dep)

Runs 1 replica of the jakousa/dwk-app2 container
Pod labeled with app: hashresponse
Container listens on port 3000
Service (hashresponse-svc)

Type: NodePort - exposes the application externally
Selector: app: hashresponse - routes traffic to matching pods
Port Configuration:
targetPort: 3000 - the port the container listens on
port: 1234 - the port exposed by the Service for internal cluster access
nodePort: 30080 - the port exposed on every cluster node for external access
There are two ways to access the app:

From within the cluster: hashresponse-svc:1234
From your local machine: localhost:8082
k3d maps host port 8082 → NodePort 30080
Traffic flows as follows when the app is accessed from your local machine:


localhost:8082
↓
k3d load balancer
↓
node:30080 (NodePort)
↓
Pod container:3000
So the k3d's load balancer enables localhost access during development.

About Kubernetes routing

The cluster was created as follows


k3d cluster create --port 8082:30080@agent:0 -p 8081:80@loadbalancer --agents 2
So the localhost:8082 is forwarded to port 30080 of the node agent:0 inside the cluster. What if the application is running on another cluster node?

The @agent:0 only determines which node receives external traffic from your host machine. After that, Kubernetes Service networking takes over and routes to the correct pod location automatically.

This is why NodePort services are so powerful. You don't need to know or care which node the pod is on. The service handles all the routing internally.