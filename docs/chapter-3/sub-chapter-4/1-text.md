StatefulSets and Jobs
What you'll learn in this page
Deploy a stateful application, such as a database, to Kubernetes
Use jobs and cronjobs to execute periodic or single-time tasks
StatefulSets
In Chapter 2, we learned how volumes are used with PersistentVolumes and PersistentVolumeClaims. We used Deployment with them, and everything worked well enough for our testing purposes. If there is just one pod in a deployment, all is fine. When scaling, things might be different. The problem is that Deployment creates and scales pods that are replicas - they are new copies of the same container that are running in parallel. So the volume is shared by all pods in that deployment. For read-only volumes, this is ok, but for volumes that have read-write access, this might cause problems and can in the worst case, cause even data corruption.

StatefulSets(opens in a new tab) are similar to Deployments except they make sure that if a pod dies, the replacement is identical, with the same network identity and name. In addition, if the pod is scaled, each copy will have its own storage. So, StatefulSets are for stateful applications, where the state is stored inside the app, not outside, such as in a database. StatefulSets are ideal for scaling applications that require persistent state, such as video game servers (e.g., Minecraft servers) or databases. One key advantage of using StatefulSets is that they ensure data safety by not deleting the associated volumes when the StatefulSet is deleted.

ReplicaSets
Deployment creates pods using a resource called ReplicaSet. We're using ReplicaSets through Deployments, so we haven't really had to talk about them.

Let's run the key-value database Redis(opens in a new tab) and save some data there. We're going to need a PersistentVolume as well as an application that utilizes the Redis.

StatefulSet requires a "Headless Service" to be responsible for the network identity. Let us start by defining a "headless service" with clusterIP: None, which will instruct Kubernetes not to do proxying or load balancing, but instead allow direct access to the Pods, the file service.yaml looks like the following:


apiVersion: v1
kind: Service
metadata:
  name: redis-svc
  labels:
    app: redis
spec:
  ports:
  - port: 6379
    name: web
  clusterIP: None
  selector:
    app: redisapp
The stateful set with two containers, Redis and redisfiller(opens in a new tab), which is a simple app that uses Redis, is configured in the file statefulset.yaml:


apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-stset
spec:
  serviceName: redis-svc
  replicas: 2
  selector:
    matchLabels:
      app: redisapp
  template:
    metadata:
      labels:
        app: redisapp
    spec:
      containers:
        - name: redisfiller
          image: jakousa/dwk-app5:54203329200143875187753026f4e93a1305ae26
        - name: redis
          image: redis:5.0
          ports:
            - name: web
              containerPort: 6379
          volumeMounts:
            - name: redis-data-storage
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: redis-data-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: local-path
        resources:
          requests:
            storage: 100Mi
Note that since the containers are now inside the same pod, those share the network and the redisfiller app sees Redis in address localhost:6379.

The stateful set looks a lot like a Deployment but uses a volumeClaimTemplate(opens in a new tab) to claim its own volume for each pod.

In Chapter 2 we jumped through a few hurdles to get ourselves storage, but now we use a K3s-provided dynamically provisioned storage by specifying storageClassName: local-path

Since the local-path storage(opens in a new tab) is dynamically provisioned, we don't need to create PersistentVolume for the volume, K3s takes care of that for us.

To learn more, see Rancher documentation(opens in a new tab) and read more about dynamic provisioning(opens in a new tab). If you want, you can revisit the examples and exercises of Chapter 2 and use dynamic provisioning instead of manual provisioning in your applications!

You can now open two terminals and run $ kubectl logs -f redis-stset-X redisfiller where X is 0 or 1. To confirm it's working we can delete a pod and it will restart and continue right where you left off. In addition, we can delete the StatefulSet and the volume will stay and bind back when you apply the StatefulSet again.

Let us once more stress the point, that a StatefulSet creates a separate volume for all the replicas. We can see, that there are indeed two PersistentVolumeClaims for our app:


$ kubectl get pvc
NAME              STATUS   VOLUME                   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
data-redis-ss-0   Bound    pvc-f318ca82-d584-4e10   100Mi      RWO            local-path     53m
data-redis-ss-1   Bound    pvc-d8e5b81a-05ec-420b   100Mi      RWO            local-path     53m
So the volumeClaimTemplates in the StatefulSet definition is used to create an individual PersistentVolumeClaim for each of the replicas in the set.

Let us observe a bit more carefully how the headless Service works. As seen in the above definition, it was defined with clusterIP: None, so the service has no cluster IP and the access should be done directly to the pods.

Let us try to ping to the service from our busybox pod:


$ ping redis-svc
PING redis-svc (10.42.2.25): 56 data bytes
64 bytes from 10.42.2.25: seq=0 ttl=64 time=0.165 ms
So it seems that it is possible to reach the service by using just the service name redis-svc, it resolved to IP address 10.42.2.25.

With the command nslookup(opens in a new tab) we can see that actually the domain name of the service redis-svc resolves to two different IP addresses:


$ nslookup redis-svc
Name:	redis-svc.default.svc.cluster.local
Address: 10.42.2.25
Name:	redis-svc.default.svc.cluster.local
Address: 10.42.1.32
So, the ping just picked the first of the IP address. All the replicas of the set have actually own domain names:


$ ping redis-stset-0.redis-svc
PING redis-ss-0.redis-svc (10.42.2.25): 56 data bytes
64 bytes from 10.42.2.25: seq=0 ttl=64 time=0.214 ms

$ ping redis-stsets-1.redis-svc
PING redis-ss-1.redis-svc (10.42.1.32): 56 data bytes
64 bytes from 10.42.1.32: seq=0 ttl=62 time=0.140 ms
The identities of the pods are permanent, so if e.g. the pod redis-stset-0 dies, it is guaranteed to have the same name when it is scheduled again, and it is still attached to the same volume.

Combining resource definitions in one file
Note that it is possible to define the StatefulSet and the corresponding headless Service in the same file by separating those with three - characters:


apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-stset
spec:
  serviceName: redis-svc
  replicas: 2
  selector:
    matchLabels:
      app: redisapp
  # more rows
---
apiVersion: v1
kind: Service
metadata:
  name: redis-svc
  labels:
    app: redis
spec:
  ports:
  - port: 6379
    name: web
  clusterIP: None
  selector:
    app: redisapp
The same naturally applies also for the other resources, eg., deployment and the corresponding service can de defined in a single yaml-file.