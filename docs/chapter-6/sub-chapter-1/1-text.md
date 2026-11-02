Kubernetes Internals
What you'll learn in this page
Explaining in broad terms how Kubernetes operates
Instead of thinking about Kubernetes as something completely new I've found that comparing it to an operating system helps. I'm not an expert in operating systems but we've all used them.

Kubernetes is a layer on top of which we run our applications. It takes the resources that are accessible from the layers below and manages our applications and resources. It also provides services, such as the DNS, for the applications. With this OS mindset, we can also try to go the other way: You may have used a cron(opens in a new tab) (or Windows' task scheduler(opens in a new tab)) for scheduling batch jobs such as saving backups of some applications. The same thing in Kubernetes can be done with CronJobs(opens in a new tab).

Now that we'll start talking about the internals we'll learn new insight on Kubernetes and will be able to prevent and solve problems that may result from its nature.

Since this section is mostly a reiteration of Kubernetes documentation, I will include various links to the official version of the documentation. Despite talking about internals, we shall not discuss how to set up our own Kubernetes cluster manually. If you want to get your hands dirty with a setup, you should read and complete Kubernetes the Hard Way(opens in a new tab) by Kelsey Hightower.

Controllers
Controllers(opens in a new tab) watch the state of your cluster and then try to move the current state of the cluster closer to the desired state. When you declare X replicas of a Pod in your deployment.yaml, a controller called Replication Controller(opens in a new tab) makes sure that will be true. There are a number of controllers for different responsibilities.

Kubernetes Control Plane
Kubernetes Control Plane(opens in a new tab) is responsible for managing the Kubernetes cluster. It is the primary orchestrating component that ensures the cluster's desired state matches its actual state. The control plane makes global decisions about the cluster (such as scheduling), as well as detecting and responding to cluster events (such as starting up a new pod when a replica's field of a deployment is unsatisfied).

The control plane consists of

etcd
A key-value storage that Kubernetes uses to save all cluster data.
kube-scheduler
Decides on which node a Pod should be run on.
kube-controller-manager
Is responsible for and runs all of the controllers.
kube-apiserver
This exposes the Kubernetes Control Plane through an API
There's also cloud-controller-manager that lets you link your cluster into a cloud provider's API. If you wanted to build your own cluster on Hetzner(opens in a new tab), for example, you could use hcloud-cloud-controller-manager(opens in a new tab) in your own cluster installed on their VMs.

Node Components
Every node has a number of components(opens in a new tab) that maintain the running pods.

kubelet
Makes sure containers are running in a Pod
kube-proxy
Network proxy and maintainer of the network rules. Enables connections outside and inside the cluster, as well as Services to work as we've been using them.
Each node also has the Container Runtime(opens in a new tab). We have been using Docker as the runtime for this course.

Add alt
Addons
In addition to all of the previously mentioned, Kubernetes has Addons(opens in a new tab) that use the same Kubernetes resources we've been using and extend Kubernetes. You can view which resources the addons have created in the kube-system namespace.


$ kubectl -n kube-system get all
NAME                                          READY   STATUS      RESTARTS   AGE
pod/coredns-ccb96694c-t9rr2                   1/1     Running     0          42h
pod/helm-install-traefik-crd-5446f            0/1     Completed   0          42h
pod/helm-install-traefik-p8c2h                0/1     Completed   2          42h
pod/local-path-provisioner-5cf85fd84d-s9x7p   1/1     Running     0          42h
pod/metrics-server-5985cbc9d7-hngw9           1/1     Running     0          42h
pod/svclb-traefik-68897c6e-bq9k7              2/2     Running     0          42h
pod/svclb-traefik-68897c6e-kw5p4              2/2     Running     0          42h
pod/svclb-traefik-68897c6e-qkc5c              2/2     Running     0          42h
pod/traefik-5d45fc8cc9-ws66x                  1/1     Running     0          42h

NAME                     TYPE           CLUSTER-IP     EXTERNAL-IP                                 PORT(S)                      AGE
service/kube-dns         ClusterIP      10.43.0.10     <none>                                      53/UDP,53/TCP,9153/TCP       42h
service/metrics-server   ClusterIP      10.43.224.88   <none>                                      443/TCP                      42h
service/traefik          LoadBalancer   10.43.140.57   192.168.144.3,192.168.144.4,192.168.144.5   80:32558/TCP,443:32155/TCP   42h

NAME                                    DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
daemonset.apps/svclb-traefik-68897c6e   3         3         3       3            3           <none>          42h

NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/coredns                  1/1     1            1           42h
deployment.apps/local-path-provisioner   1/1     1            1           42h
deployment.apps/metrics-server           1/1     1            1           42h
deployment.apps/traefik                  1/1     1            1           42h

NAME                                                DESIRED   CURRENT   READY   AGE
replicaset.apps/coredns-ccb96694c                   1         1         1       42h
replicaset.apps/local-path-provisioner-5cf85fd84d   1         1         1       42h
replicaset.apps/metrics-server-5985cbc9d7           1         1         1       42h
replicaset.apps/traefik-5d45fc8cc9                  1         1         1       42h

NAME                                 STATUS     COMPLETIONS   DURATION   AGE
job.batch/helm-install-traefik       Complete   1/1           42s        42h
job.batch/helm-install-traefik-crd   Complete   1/1           31s        42h
To get a complete picture of how each part communicates with each other, read the article what happens when k8s(opens in a new tab) which explores what happens when you do kubectl run nginx --image=nginx --replicas=3 shedding some more light on the magic that happens behind the scenes.

Self-healing
Back in Chapter 2, we talked a little about the "self-healing" nature of Kubernetes and how pods can be deleted and they're automatically recreated.

Let's see what happens if we delete a node that has a pod in it. Let's first deploy the pod, a web application with ingress from part 1, confirm that it's running and then see which pod has it running.


$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app2/manifests/deployment.yaml \
                -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app2/manifests/ingress.yaml \
                -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app2/manifests/service.yaml
  deployment.apps/hashresponse-dep created
  ingress.extensions/dwk-material-ingress created
  service/hashresponse-svc created

$ curl localhost:8081
9eaxf3: 8k2deb

$ kubectl describe po hashresponse-dep-57bcc888d7-5gkc9 | grep 'Node:'
  Node:         k3d-k3s-default-agent-1/172.30.0.2
In this case it's in agent-1. Let's make the node go "offline" with pause:


$ docker ps
  CONTAINER ID        IMAGE                      COMMAND                  CREATED             STATUS              PORTS                                           NAMES
  5c43fe0a936e        rancher/k3d-proxy:v3.0.0   "/bin/sh -c nginx-pr…"   10 days ago         Up 2 hours          0.0.0.0:8081->80/tcp, 0.0.0.0:50207->6443/tcp   k3d-k3s-default-serverlb
  fea775395132        rancher/k3s:latest         "/bin/k3s agent"         10 days ago         Up 2 hours                                                          k3d-k3s-default-agent-1
  70b68b040360        rancher/k3s:latest         "/bin/k3s agent"         10 days ago         Up 2 hours          0.0.0.0:8082->30080/tcp                         k3d-k3s-default-agent-0
  28cc6cef76ee        rancher/k3s:latest         "/bin/k3s server --t…"   10 days ago         Up 2 hours                                                          k3d-k3s-default-server-0

$ docker pause k3d-k3s-default-agent-1
k3d-k3s-default-agent-1
Now wait for a while and this should be the new state:


$ kubectl get po
NAME                                READY   STATUS        RESTARTS   AGE
hashresponse-dep-57bcc888d7-5gkc9   1/1     Terminating   0          15m
hashresponse-dep-57bcc888d7-4klvg   1/1     Running       0          30s

$ curl localhost:8081
6xluh2: ta0ztp
What did just happen? Read this explanation on how kubernetes handles offline nodes(opens in a new tab)

Well then, what happens if you delete the only control-plane node? Nothing good. In our local cluster it's our single point of failure. See Kubernetes documentation for "Options for Highly Available topology(opens in a new tab)" to avoid getting the whole cluster crippled by a single faulty hardware.