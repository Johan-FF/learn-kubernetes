First deploy
What you'll learn in this page

create and run a Kubernetes cluster locally with k3d

deploy a simple application to Kubernetes
What are microservices?
In this course, we'll talk about microservices and create microservices. Before we get started with anything else we'll need to define what a microservice is. Currently, there are many different definitions for microservices.

For this course, we'll choose the definition set by Sam Newman in the book Building Microservices(opens in a new tab)
:

Microservices are small, autonomous services that work together

The opposite of a microservice is a service, or application that is self-contained and independent called a Monolith(opens in a new tab)
.

When to use microservices? In the following video where Sam Newman and Martin Fowler discuss microservices, the answer is: "When you've got a really good reason".

It also includes the top 3 reasons for using microservices:

- Zero-downtime independent deployability
- Isolation of data and of processing around that data
- Use microservices to reflect the organizational structure

An application following a microservices architecture is composed of several, potentially even dozens, of independently operating services. Managing and operating such a complex system is challenging. This is where Kubernetes comes into play.

What is Kubernetes?
Imagine you have three processes that need to be executed, but you only have two computers available, and neither computer is capable of handling all three processes simultaneously. How would you approach this problem?

You'll have to start by deciding which 2 processes go on the same computer and which 1 will be on the different one. How would you fit them? By having the ones demanding the most resources and the least resources on the same machine or having the most demanding be on its own? Maybe you want to add one process and now you have to reorganize all of them. What happens when you have more than 2 computers and more than 3 processes? One of the processes is eating all of the memory and you need to get that away from the "critical-bank-application". Should we virtualize everything? Containers would solve that problem, right? Would you move the most important process to a new computer? Maybe some of the processes need to communicate with each other and now you have to deal with networking. What if one of the computers breaks? What about your Friday plans to visit the local Craft brewery?

What if you could just define "This process should have 6 copies using X amount of resources." and have the 2..N computers working as a single entity to fulfill your request? That's just one thing Kubernetes makes possible.

In essence, Kubernetes is the sum of all the bash scripts and best practices that most system administrators would cobble together over time, presented as a single system behind a declarative set of APIs.— Kelsey Hightower (@kelseyhightower) May 6, 2019

Or more officially:

“Kubernetes (K8s) is an open-source system for automating deployment, scaling, and management of containerized applications. It groups containers that make up an application into logical units for easy management and discovery.” - kubernetes.io(opens in a new tab)

A container orchestration system such as Kubernetes is often required when maintaining containerized applications. The main responsibility of an orchestration system is the starting and stopping of containers. In addition, they offer networking between containers and health monitoring. Rather than manually doing docker run critical-bank-application every time the application crashes, or restarting it if it becomes unresponsive, we want the system to keep the application automatically healthy.

You should already know an orchestration system, Docker Compose, which also takes care of the same tasks; starting and stopping containers, networking, and health monitoring. What makes Kubernetes special is the robust feature set that automates all of it.

Read this comic(opens in a new tab)
 and watch the video below to get a fast introduction. You may want to revisit these after this part!

We will get started with a lightweight Kubernetes distribution. K3s - 5 less than K8s(opens in a new tab)
, offers us an actual Kubernetes cluster that we can run in containers using k3d(opens in a new tab)
.

Kubernetes cluster with k3d
Before getting started we need a bit of setup.

Installing kubectl
Kubectl is a command-line tool that we will use to communicate with our Kubernetes cluster. Install it now by following their instructions(opens in a new tab)
.

Installing k3d
In this course we will use k3d, which is a lightweight Kubernetes distribution by Rancher. The installation instructions for k3d are here. Go ahead and follow them! The course material has been tested with version v5.8.3 of k3d.

Note about k3d permission errors
You might get a Permission denied error while using k3d as a normal user.

Be sure to go through this docker post-installation step(opens in a new tab)

Running k3d as sudo leads to problems such as generating the kubeconfig in wrong place i.e. not into ~/.kube.
What is a cluster?
A cluster is a group of machines, nodes, that work together - in this case, they are part of a Kubernetes cluster. Kubernetes cluster can be of any size - a single node cluster would consist of one machine that hosts the Kubernetes control-plane (exposing API and maintaining the cluster) and that cluster can then be expanded with up to 5000 nodes total, as of Kubernetes v1.36.

We will use the term "server node" to refer to nodes with control-plane and "agent node" to refer to the nodes without that role. A basic kubernetes cluster may look like this:


Starting a cluster with k3d
We'll use k3d to create a group of Docker containers that run k3s. The reason for using k3d is that it enables us to create a cluster without worrying about virtual machines or physical machines. With k3d our basic cluster will look like this:


Because the nodes are containers we are going to need to do a little bit of configuring to get those working like we want. We will get to that later. Creating our very own Kubernetes cluster with k3d is done by a single command.


$ k3d cluster create -a 2
This created a Kubernetes cluster with 2 agent nodes. As they're in Docker you can confirm that they exist with docker ps (fields CREATED and STATUS are left out):


$ docker ps
CONTAINER ID   IMAGE                            COMMAND                  PORTS                             NAMES
fb56dc7a0347   ghcr.io/k3d-io/k3d-tools:5.8.3   "/app/k3d-tools noop"                                      k3d-k3s-default-tools
c57587e96682   ghcr.io/k3d-io/k3d-proxy:5.8.3   "/bin/sh -c nginx-pr…"   80/tcp, 0.0.0.0:51982->6443/tcp   k3d-k3s-default-serverlb
f7d87ef8a006   rancher/k3s:v1.31.5-k3s1         "/bin/k3d-entrypoint…"                                     k3d-k3s-default-agent-1
87fdb4b3e0f6   rancher/k3s:v1.31.5-k3s1         "/bin/k3d-entrypoint…"                                     k3d-k3s-default-agent-0
358429b7517a   rancher/k3s:v1.31.5-k3s1         "/bin/k3d-entrypoint…"                                     k3d-k3s-default-server-0
We also see that port 6443 is opened to "k3d-k3s-default-serverlb", a useful "load balancer" proxy, that'll redirect a connection to 6443 into the server node, and that's how we can access the contents of the cluster. The port on our machine, above 51982, is randomly chosen. We could have opted out of the load balancer with k3d cluster create -a 2 --no-lb and the port would be open straight to the server node. Having a load balancer will offer us a few features we wouldn't otherwise have, so let's keep it in.

K3d helpfully also set up a kubeconfig(opens in a new tab)
, a file that is used to organize information about clusters, users, namespaces, and authentication mechanisms. The contents of the file can be seen with the command k3d kubeconfig get k3s-default.

The other tool that we will be using in this course is kubectl(opens in a new tab)
. Kubectl is the Kubernetes command-line tool and will allow us to interact with the cluster. Kubectl will read kubeconfig from the location in KUBECONFIG environment value or by default from ~/.kube/config and use the information to connect to the cluster. The contents include certificates, passwords and the address of the cluster API. You can set the context with kubectl config use-context k3d-k3s-default.

Now kubectl will be able to access the cluster


$ kubectl cluster-info
Kubernetes control plane is running at https://0.0.0.0:51982
CoreDNS is running at https://0.0.0.0:51982/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
Metrics-server is running at https://0.0.0.0:51982/api/v1/namespaces/kube-system/services/https:metrics-server:https/proxy
We can see that kubectl is connected to the container k3d-k3s-default-serverlb through (in this case) port 51982.

If you want to stop / start the cluster you can simply run


$ k3d cluster stop
  INFO[0000] Stopping cluster 'k3s-default'
  INFO[0011] Stopped cluster 'k3s-default'

$ k3d cluster start
  INFO[0000] Using the k3d-tools node to gather environment information
  INFO[0000] Starting existing tools node k3d-k3s-default-tools...
  INFO[0000] Starting Node 'k3d-k3s-default-tools'
  INFO[0001] Starting new tools node...
  INFO[0001] Starting Node 'k3d-k3s-default-tools'
  INFO[0003] Starting cluster 'k3s-default'
  INFO[0003] Starting servers...
  INFO[0003] Starting Node 'k3d-k3s-default-server-0'
  INFO[0010] Starting agents...
  INFO[0010] Starting Node 'k3d-k3s-default-agent-1'
  INFO[0011] Starting Node 'k3d-k3s-default-agent-0'
  INFO[0027] Starting helpers...
  INFO[0027] Starting Node 'k3d-k3s-default-serverlb'
  INFO[0027] Starting Node 'k3d-k3s-default-tools'
  INFO[0035] Injecting records for hostAliases (incl. host.k3d.internal) and for 5 network members into CoreDNS configmap...
  INFO[0038] Started cluster 'k3s-default'
For now, we're going to need the cluster running, but if we want to remove the cluster we can run k3d cluster delete.

First Deploy
Preparing for first deploy
Before we can deploy anything we'll need to do a small application to deploy. During the course, you will develop your own application. The technologies used for the application do not matter - for the examples we're going to use Node.js(opens in a new tab)
 but the example application will be offered through GitHub as well as Docker Hub.

Let's launch an application that generates and outputs a hash every 5 seconds or so.

I have prepared one here(opens in a new tab)
, you can test it with docker run jakousa/dwk-app1.

To deploy an image, we need the cluster to have access to the image. By default, Kubernetes is intended to be used with a registry. We will use the familiar registry Docker Hub, which we also used in DevOps with Docker(opens in a new tab)
. If you've never used Docker Hub, it is the place where the Docker client defaults to. For example, when you run docker pull nginx, the nginx image comes from Docker Hub. See the course DevOps with Docker for further details, e.g., on pushing your images to Docker Hub if needed.

It is also possible to use local images with k3d, but that won't work with non-k3d solutions. If you want to try using local images, use k3d image import <image-name>. Then you must edit the deployment's imagePullPolicy(opens in a new tab)
 from the default Always to IfNotPresent or Never to allow the local image to be used. The deployment can be edited after creation with kubectl edit deployment <deployment-name>.

Please note that on Windows, it automatically opens Notepad. You need to save with CTRL + S, then close the Notepad tab to fully apply it. If you just CTRL + C in the terminal, the changes won't be applied!

Example applications
In the future, the material will use the offered applications in the commands. You may follow along by changing the image to your application. Almost everything is found in the same repository https://github.com/kubernetes-hy/material-example.

Now we are finally ready to deploy our first app into Kubernetes!

Deployment
To deploy an application, we will need to create a deployment(opens in a new tab)
 object with the image:


kubectl create deployment hashgenerator-dep --image=jakousa/dwk-app1 
This action created a few things for us to look at

- a deployment(opens in a new tab)
-  resource and
- a pod(opens in a new tab)
-  resource.
What is a Pod?
Pod is an abstraction around one or more containers. Pods provide a context for 1..N containers so that they can share storage and a network. It's very much like how you have used containers to define environments for a single process. They can be thought of as a container of containers. Most of the same rules apply: a pod is deleted if the containers within stop running and the contained files will be lost with it.


Reading through the documentation or searching the internet are not the only ways to find information about the different resources Kubernetes has. We can get access to simple explanations straight from our command line using kubectl explain RESOURCE command.

For example, to get a description of what a Pod is and its mandatory fields, we can use the following command.


$ kubectl explain pod
  KIND:     Pod
  VERSION:  v1

  DESCRIPTION:
       Pod is a collection of containers that can run on a host. This resource is
       created by clients and scheduled onto hosts.
In Kubernetes, all entities that exist are called objects(opens in a new tab)
. You can list all objects of a resource with kubectl get RESOURCE.


$ kubectl get pods
  NAME                               READY   STATUS    RESTARTS   AGE
  hashgenerator-dep-6965c5c7-2pkxc   1/1     Running   0          2m1s
What is a Deployment resource?
A deployment(opens in a new tab)
 resource takes care of the deployment. It's a way to tell Kubernetes what container you want, how they should be running, and how many of them should be running.

While we created the Deployment, a ReplicaSet object was created. ReplicaSets are used to tell how many replicas of a Pod you want. It will delete or create Pods until the number of Pods you want is running. ReplicaSets are managed by Deployments and you do not need to define or modify them manually. If you want to manage the number of replicas, you can edit the Deployment and it will take care of modifying the ReplicaSet.

You can view the deployments as follows:


$ kubectl get deployments
  NAME                READY   UP-TO-DATE   AVAILABLE   AGE
  hashgenerator-dep   1/1     1            1           54s
1/1 replicas are ready! We will try multiple replicas later.

To see the output we can run kubectl logs -f hashgenerator-dep-6965c5c7-2pkxc

Automatic completion
You can use `source <(kubectl completion bash)` to save yourself from a lot of headaches. Add it to .bashrc for an automatic load. (Also available for zsh with `source <(kubectl completion zsh)`). If you've never used completion read this tutorial. More information about the kubectl completion command can be found here.
A helpful list for other commands from docker-cli translated to kubectl is available here https://kubernetes.io/docs/reference/kubectl/docker-cli-to-kubectl/(opens in a new tab)

Exercise: