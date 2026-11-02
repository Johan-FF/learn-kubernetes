Introduction to Storage
What you'll learn in this page
use volumes to share data between two containers in a pod
persistent volumes to store data on the disk of a node
There are two things that are known to be difficult with Kubernetes. First is networking. Thankfully, we can avoid most of the networking difficulties unless we are going to set up our own cluster. If you're interested, you can watch this Webinar on Kubernetes and Networks: Why is This So Dang Hard?(opens in a new tab) but we'll skip most of the topics discussed in the video. The other of the most difficult things is storage.

In this chapter, we will explore a very basic approach to utilizing storage in Kubernetes, with plans to revisit this topic in greater detail later on. Unlike most aspects of Kubernetes, which are highly dynamic and capable of effortlessly shifting between nodes and replicating, storage presents unique challenges and limitations. The article Why Is Storage On Kubernetes So Hard? offers a comprehensive overview of these difficulties and discusses various strategies to address them.

A volume(opens in a new tab) in Docker and Docker Compose is the way to persist the data the containers are using. In Kubernetes things are much more complicated, there are several types of volumes.

emptyDir volumes
The simple Kubernetes volumes, in technical terms emptyDir volumes, are shared filesystems inside a pod. This means that their lifecycle is tied to a pod, and when the pod is destroyed, the data is lost. In addition, simply moving the pod from another node will destroy the contents of the volume as the space is reserved from the node the pod is running on. So surely you should not use emptyDir volumes, e.g., for backing up a database. Even with the limitations, it may be used as a cache as it persists between container restarts, or it can be used to share files between two containers in a pod.

Before we can get started with this, we need an application that shares data with another application. In this case, it will work as a method to share simple log files with each other. We'll need to develop two apps:

The image finder that checks if /usr/src/app/files/image.jpg exists and if not, it downloads a random image and saves it as image.jpg. Any HTTP request will trigger a new image generation.
The image responder that checks for the file /usr/src/app/files/image.jpg and shows it, if it is available.
The apps share a deployment so that both of them are inside the same pod. My version is available for you to use here(opens in a new tab). The example includes an Ingress and a Service to access the application. The file deployment.yaml looks like the following:

Highlighted lines: 15 to 17, 21, 26
apiVersion: apps/v1
kind: Deployment
metadata:
  name: images-dep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: images
  template:
    metadata:
      labels:
        app: images
    spec:
      volumes: # Define volume
        - name: shared-image
          emptyDir: {}
      containers:
        - name: image-finder
          image: jakousa/dwk-app3-image-finder:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
          volumeMounts: # Mount volume
          - name: shared-image
            mountPath: /usr/src/app/files
        - name: image-response
          image: jakousa/dwk-app3-image-response:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
          volumeMounts: # Mount volume
          - name: shared-image
            mountPath: /usr/src/app/files
As can be seen, the deployment defines an emptyDir volume that is given the name shared-image. Both the containers within the pod are mounting the volume to path /usr/src/app/files.

We can now test the app by applying the deployment, service and ingress:


kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/b9ff709b4af7ca13643635e07df7367b54f5c575/app3/manifests/deployment.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/b9ff709b4af7ca13643635e07df7367b54f5c575/app3/manifests/service.yaml
kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/b9ff709b4af7ca13643635e07df7367b54f5c575/app3/manifests/ingress.yaml
The provided Ingress uses the previously opened port 8081 so we can get the image with browser from the url http://localhost:8081(opens in a new tab)

Note that all data is lost when the pod goes down, so the image you get from the image responder stays the same while pod is up and running but changes when the pod restarts.

Exercise: