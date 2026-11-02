Networking between pods
What you'll learn in this page
Kubernetes DNS
Sending requests from a pod to another pod within a cluster
In the previous chapter we managed to setup networking configuration to enable routing traffic from outside of the cluster to a container inside a pod. In this chapter we'll focus on communication between pods.

Kubernetes includes a built-in DNS service, so communication between pods and containers is conceptually similar to how containers communicate in Docker Compose. All containers within the same pod share a network, which means they can reach each other via localhost. For communication between different pods, Kubernetes Services are used to expose pods as stable network endpoints, allowing other pods to access them reliably.

The following service, taken from an exercise in the last part, creates a cluster-internal IP which will enable other pods in the cluster to access the port 3000 of the todo-backend application in http://todo-backend-svc:2345(opens in a new tab):


apiVersion: v1
kind: Service
metadata:
  name: todo-backend-svc
spec:
  type: ClusterIP
  selector:
    app: todo-backend
  ports:
    - port: 2345
      protocol: TCP
      targetPort: 3000
Alternatively each Pod has an IP created by Kubernetes.

A debugging pod
Sometimes, the best way to debug is to manually test what is going on. You can just go inside a pod or send a request manually from another pod. You can use eg. busybox(opens in a new tab), that is a light weight Linux distro for debugging.

Let us start a busybox pod by applying the following yaml:


apiVersion: v1
kind: Pod
metadata:
  name: my-busybox
  labels:
    app: my-busybox
spec:
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
    name: busybox
  restartPolicy: Always
Note that the resource type (kind) is not a Deployment that we have so far used but a Pod.

Now we can just exec a command:


$ kubectl exec -it my-busybox -- wget -qO - http://todo-backend-svc:2345
We used the wget(opens in a new tab) command since our usual tool for the purposes, curl, is not readily available in busybox.

We can also open a shell to the pod with command kubectl exec(opens in a new tab) to run several commands:


$ kubectl exec -it my-busybox -- sh
/ # wget -qO - http://todo-backend-svc:2345
<!DOCTYPE html>
<html lang="en">
<head>
</head>
<body>
  <main>
    <div>
      <h1>The project App</h1>
      <img src="image" alt="Kubeapp" width="300" />
      <form action="/todos" method="post">
        <input type="text" id="content" name="content" maxlength="140" required>
        <button type="submit">Create todo</button>
      </form>
      <ul>
          <li>Learn JavaScript</li>
          <li>Learn React</li>
          <li>Build a project</li>
      </ul>
      <p>DevOps with Kubernetes 2026</p>
    </div>
  </main>
  </body>
$ exit
You get the same result by using the service cluster IP address. Let us check the address:


$ kubectl get svc
NAME               TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)    AGE
todo-backend-svc   ClusterIP   10.43.89.182   <none>        2345/TCP   2d1h
The following shows the main page of the todo-app:


$ kubectl exec -it my-busybox -- wget -qO - http://10.43.89.182:2345
Let us try to access a pod directly. We can get the IP address with kubectl describe command:


$ kubectl describe pod todo-backend-dep-84fcdff4cc-2x9wl
Name:             todo-backend-dep-84fcdff4cc-2x9wl
Namespace:        default
Priority:         0
Service Account:  default
Node:             k3d-k3s-default-agent-0/192.168.176.5
Start Time:       Mon, 08 Apr 2024 23:27:00 +0300
Labels:           app=todo-backend
                  pod-template-hash=84fcdff4cc
Annotations:      <none>
Status:           Running
IP:               10.42.0.63
So one of the pods that is running the todo-app has cluster internal IP address 10.42.0.63. We can wget to this address, but this time we have to remember that the port in the pod is 3000:


$ kubectl exec -it my-busybox wget -qO - http://10.42.0.63:3000
Note that in contrast to the last part, we have now created a stand-alone pod in our cluster, there was no deployment object at all. Once we are done, we should destroy the pod, eg. with the command


$ kubectl delete pod/my-busybox
In general, these kinds of "stand-alone" pods are good for debugging but all application pods should be created by using a deployment. The reason for this is that if a node where the pod resides crashes, the stand-alone pods are gone. When a pod is controlled by a deployment, Kubernetes takes care of redeployment in case of node failures.

Your debugging pod

The example used Busybox for the debugging pod, thanks to the original author of this course, the esteemed Docker Captain Jami Kousa. Busybox is an okay choice, but it is a bit limited. For example, it does not have curl(opens in a new tab) installed. You may prefer another option for your debugging pod. It might be the off-the-shelf Ubuntu image or something else you have configured and built for your taste and needs.