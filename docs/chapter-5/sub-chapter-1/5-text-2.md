Canary release
With rolling updates, when including the Probes, we could create releases with no downtime for users. Sometimes this is not enough, and you need to be able to do a partial release for some users and get usage data and statistics for the upcoming release. Canary release(opens in a new tab) is the term used to describe a release strategy in which we introduce a subset of the users to a new version of the application. When the confidence in the new release grows, the number of users in the new version can be increased until the old version is no longer used.

At the moment of writing this, Canary is not a strategy for deployments that Kubernetes would provide out of the box. This may be due to the ambiguity of the methods for canary release. We will use Argo Rollouts(opens in a new tab) to test one type of canary release:


$ kubectl create namespace argo-rollouts
$ kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
Now we have a new resource Rollout(opens in a new tab) available to us. The Rollout, in the file rollout.yaml will replace our previously created deployment and enable us to use a new field:


apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: flaky-update-dep
spec:
  replicas: 4
  selector:
    matchLabels:
      app: flaky-update
  strategy:
    canary:
      steps:
      - setWeight: 25
      - pause:
          duration: 30s
      - setWeight: 50
      - pause:
          duration: 30s
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

---
# the service definition could be put here
The above strategy will first move 25% (setWeight(opens in a new tab)) of the pods to a new version, after which it will wait for 30 seconds, move to 50% of pods, and then wait for 30 seconds until every pod is updated.

When we apply the rollout for the first time, all pods are created immediately. The gradual canary rollout happens when we change the image. You can see how it works by changing the image tag to v5 (that is another healthy app) and following the rollout to progress, e.g., with the following command that also shows the image in a pod:


$ kubectl get pods -l app=flaky-update -o 'custom-columns=NAME:.metadata.name,IMAGES:.spec.containers[*].image' -w
Immediately after applying the change you will see only one pod running the new version:

Highlighted lines: 4
flaky-update-dep-5b746c477-2jbtb   mluukkai/dwk-app8:v1
flaky-update-dep-5b746c477-nj9cb   mluukkai/dwk-app8:v1
flaky-update-dep-5b746c477-p2xpm   mluukkai/dwk-app8:v1
flaky-update-dep-5b746c477-q6g26   mluukkai/dwk-app8:v5
After a while, all the pods are running the image mluukkai/dwk-app8:v5.

The kubectl plugin(opens in a new tab) from Argo also offers us the promote(opens in a new tab) command to enable us to pause the rollout indefinitely and then use the promote to move forward.

The Argo Rollouts kubectl plugin(opens in a new tab) actually allows you to visualize the Rollout and its related resources. To watch the Rollout as it deploys, we can run it in watch mode with the command


kubectl argo rollouts get rollout flaky-update-dep -w
The result looks like this

Add alt
There are other options, such as the maxUnavailable but the defaults will work for us. However, simply rolling slowly to production will not be enough for a canary deployment. Just like with rolling updates, we need to know the status of the application.

With another custom resource we've already installed with Argo Rollouts called AnalysisTemplate(opens in a new tab) we will be able to define a test that doesn't let the broken versions through.

Let us extend our rollout with an analysis:


  ...
  strategy:
    canary:
      steps:
      - setWeight: 50
      - analysis:
          templates:
          - templateName: restart-rate
    # ...
  ...
The analysis will be using a template called restart-rate. Next, we have to define how the analysis will be done. For that, we shall need Prometheus, which we briefly used in Chapter 3.