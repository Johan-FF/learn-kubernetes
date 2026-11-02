Even though v2 didn't work, at least the application is working. We can just push a new update on top of the v2. Let's try the v4 which should break after a short while:


$ kubectl apply -f deployment.yaml
  deployment.apps/flaky-update-dep configured
Now the ReadinessProbe may pass for the first 20 seconds, but soon enough every pod will break. Unfortunately ReadinessProbe cannot do anything about it, the deployment was successful but the application is buggy.


$ kubectl get po
  NAME                               READY   STATUS    RESTARTS   AGE
  flaky-update-dep-dd78944f4-vv27w   0/1     Running   0          111s
  flaky-update-dep-dd78944f4-dnmcg   0/1     Running   0          110s
  flaky-update-dep-dd78944f4-zlh4v   0/1     Running   0          92s
  flaky-update-dep-dd78944f4-zczmw   0/1     Running   0          90s
You may notice that the app stops responding to the address http://35.228.229.159/ after a while. The reason for this is that Kubernetes uses readiness to determine if a Service should route traffic to a pod.

Let's roll back to the previous version. This may come in handy if you ever are in a panic mode and need to roll an update back:


$ kubectl rollout undo deployment flaky-update-dep
  deployment.apps/flaky-update-dep rolled back
This will roll back into the previous version. Since it was v2, which doesn't work, we need to use a flag with the undo:


$ kubectl describe deployment flaky-update-dep | grep Image
    Image:        mluukkai/dwk-app8:v2

$ kubectl rollout undo deployment flaky-update-dep --to-revision=1
  deployment.apps/flaky-update-dep rolled back

$ kubectl describe deployment flaky-update-dep | grep Image
    Image:        mluukkai/dwk-app8:v1
Read kubectl rollout undo --help to find out more!

There's another probe that could've helped us in a situation like the v4. LivenessProbes(opens in a new tab) can be configured similarly to ReadinessProbes, but if the check fails the container will be restarted:


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
          livenessProbe:
            initialDelaySeconds: 20 # Initial delay until the liveness is tested
            periodSeconds: 5 # How often to test
            httpGet:
               path: /healthz
               port: 3541
With this let's just deploy the worst of the versions, v3.


$ kubectl apply -f deployment.yaml
  deployment.apps/flaky-update-dep configured
After a while, it may look something like this (if you're lucky).


$ kubectl get po
  NAME                                READY   STATUS    RESTARTS   AGE
  flaky-update-dep-fd65cd468-4vgwx   1/1     Running   3          2m30s
  flaky-update-dep-fd65cd468-9h877   0/1     Running   4          2m49s
  flaky-update-dep-fd65cd468-jpz2m   0/1     Running   3          2m13s
  flaky-update-dep-fd65cd468-529nr   1/1     Running   4          2m50s
At least something is working!

If your app is slow to start, a StartupProbe(opens in a new tab) can be used to delay the liveness probe and prevent it from firing prematurely. You may require it in real life but is not discussed further in this course.