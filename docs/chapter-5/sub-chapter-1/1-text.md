Update Strategies and Prometheus
What you'll learn in this page
Comparing update strategies
Deploying software with canary releases
Using Prometheus for custom queries
In the previous Chapter, we did automated updates with a deployment pipeline. The update just worked, but we have no idea how the update actually happened, other than that a pod was changed. Let us now look at how we can make the update process safer to help us reach a higher number of nines(opens in a new tab) in the availability.

There are multiple update/deployment/release strategies. We will focus on two of them:

Rolling update
Canary release
Both of these update strategies are designed to make sure that the application works during and after an update. Rather than updating every pod at the same time, the idea is to update the pods one at a time and confirm that the application works.

Rolling update
By default, Kubernetes initiates a rolling update(opens in a new tab) when we change the image. That means that every pod is updated sequentially. The rolling update is a great default since it enables the application to be available during the update. If we decide to push an image that does not work, the update will automatically stop.

I've prepared an application and images with 5 versions here.

The one with tag v1 always works
v2 never works
v3 works 90% of the time
v4 will die after 60 seconds, and
v5 always works
The following configuration can be used to get the v1 app up and running:


apiVersion: apps/v1
kind: Deployment
metadata:
  name: flaky-update-dep
spec:
  replicas: 4
  selector:
    matchLabels:
      app: flaky-update
  template:
    metadata:
      labels:
        app: flaky-update
    spec:
      containers:
        - name: flaky-update
          image: mluukkai/dwk-app8:v1

---

apiVersion: v1
kind: Service
metadata:
  name: flaky-update-svc
spec:
  selector:
    app: flaky-update
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3541
  type: LoadBalancer

Let us deploy the app:


$ kubectl apply -f deployment.yaml
  deployment.apps/flaky-update-dep created

$ kubectl get po
  NAME                                READY   STATUS    RESTARTS   AGE
  flaky-update-dep-7b5fd9ffc7-27cxt   1/1     Running   0          87s
  flaky-update-dep-7b5fd9ffc7-mp8vd   1/1     Running   0          88s
  flaky-update-dep-7b5fd9ffc7-m4smm   1/1     Running   0          87s
  flaky-update-dep-7b5fd9ffc7-nzl98   1/1     Running   0          88s

$ kubectl get svc
  NAME               TYPE           CLUSTER-IP       EXTERNAL-IP      PORT(S)        
  flaky-update-svc   LoadBalancer   34.118.229.159   35.228.249.129   80:31733/TCP
As wee see, the application is working:

Add alt
Now change the tag to v2 and apply it.


$ kubectl apply -f deployment.yaml
$ kubectl get po --watch 
  NAME                                READY   STATUS    RESTARTS   AGE
  flaky-update-dep-84f4c94bc7-dkqcw   1/1     Running   0          17s
  flaky-update-dep-84f4c94bc7-h7d2t   1/1     Running   0          9s
  flaky-update-dep-84f4c94bc7-ks9hn   1/1     Running   0          16s
  flaky-update-dep-84f4c94bc7-tmz2g   1/1     Running   0          8s
You can see that the rolling update is competed but unfortunately, the application no longer works:

Add alt
The application is running, it's just that there's a bug that prevents it from working correctly. How do we communicate this malfunction outside the application? This is where ReadinessProbes(opens in a new tab) come in.

Watch now the video on Kubernetes Health Checks with Readiness and Liveness Probes

With a ReadinessProbe Kubernetes can check if a pod is ready to process requests. The application has an endpoint /healthz(opens in a new tab) in port 3541, and we can use that to test for health. It will simply answer with status code 500 if it's not working and 200 if it is.

Let's roll the version back to v1 as well, so we can test the update to v2 again.


apiVersion: apps/v1
kind: Deployment
metadata:
  name: flaky-update-dep
spec:
  replicas: 4
  selector:
    matchLabels:
      app: flaky-update
  template:
    metadata:
      labels:
        app: flaky-update
    spec:
      containers:
        - name: flaky-update
          image: mluukkai/dwk-app8:v1
          readinessProbe:
            initialDelaySeconds: 10 # Initial delay until the readiness is tested
            periodSeconds: 5 # How often to test
            httpGet:
               path: /healthz
               port: 3541
Here the initialDelaySeconds and periodSeconds will mean that the probe is sent 10 seconds after the container is up and every 5 seconds after that. Now if we change the tag to v2 and apply it, the result will look like this:


$ kubectl apply -f deployment.yaml
  deployment.apps/flaky-update-dep configured

$ kubectl get po
  NAME                                READY   STATUS    RESTARTS   AGE
  flaky-update-dep-f5c79dbc-8lnqm     1/1     Running   0          115s
  flaky-update-dep-f5c79dbc-86fmd     1/1     Running   0          116s
  flaky-update-dep-f5c79dbc-qzs9p     1/1     Running   0          98s
  flaky-update-dep-54888b877b-dkctl   0/1     Running   0          25s
  flaky-update-dep-54888b877b-dbw29   0/1     Running   0          24s
Here, three of the pods are completely functional. One of the v1 pods was dropped to make way for the v2 ones, but since they do not work, they are never READY, and the update can not continue. As expected, we see the reason for unreadiness with the command kubectl describe:


$ kubectl describe pod flaky-update-dep-54888b877b-dkctl
...

Events:
  Type     Reason     Age                From               Message
  ----     ------     ----               ----               -------
  Normal   Scheduled  108s               default-scheduler  Successfully assigned default/flaky-update-dep-746fbdffc5-pjbdx to gke-dwk-cluster-power-b7c0b02a-2qlc
  Normal   Pulled     109s               kubelet            Container image "mluukkai/dwk-app8:v2" already present on machine
  Normal   Created    109s               kubelet            Created container: flaky-update
  Normal   Started    109s               kubelet            Started container flaky-update
  Warning  Unhealthy  3s (x20 over 97s)  kubelet            Readiness probe failed: HTTP probe failed with statuscode: 500
GKE Ingress and pod readiness
If you are using Ingress in your app, you should note that the ReadinessProbe does not work quite like one would expect, requests get also routed to pods that are not ready. The documentation recommends(opens in a new tab) the following:

If serving Pods for your Service contain multiple containers, or if you're using the GKE Enterprise Ingress controller, you should use a BackendConfig CRD to define health check parameters.

So if you want to use the GKE default ingress, BackendConfig(opens in a new tab) should be defined.

We shall continue to use Gateway API so this does not concern us.

Continuing the course with k3d
You may continue using Google Kubernetes Engine or switch back to using k3d. Since our apps now use the Gateway API, you must enable it in the k3d cluster. See here how to do it.

If you skipped the previous chapter, you might want to start using Kustomize in your apps.