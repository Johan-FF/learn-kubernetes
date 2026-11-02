Labels
Labels(opens in a new tab) are used to separate an application from others inside a namespace and to group different resources together. Labels are key-value pairs and they can be modified, added or removed at any time. Labels can also be added to almost anything.

Labels can help us humans identify resources and Kubernetes can use them to act upon a group of resources. You can query resources that have a certain label. The labels are also used by selectors(opens in a new tab) to pick a set of objects.

Let's look at the labels in a deployment.yaml file. This is the first yaml we created at the beginning of Chapter 2:

Highlighted lines: 8 to 9, 12 to 13
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hashgenerator-dep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hashgenerator
  template:
    metadata:
      labels:
        app: hashgenerator
    spec:
      containers:
        - name: hashgenerator
          image: jakousa/dwk-app1:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
In this case, the yaml includes both a selector and a label. The selector and matchLabels reveal that the instructions of the deployment are directed to pods with the label app: hashgenerator. So, labels are key-value pairs. The template metadata includes the label with key-value pair app: hashgenerator.

We can use the same label on multiple namespaces and the namespace would keep them from interfering with each other.

Grouping objects with labels is simple. We either add the label into the yaml file or use command kubectl label(opens in a new tab).

We could e.g. add a label importance=great to a pod as follows:


$ kubectl label po hashgenerator-dep-7b9b88f8bf-lvcv4 importance=great
  pod/hashgenerator-dep-7b9b88f8bf-lvcv4 labeled
Labels can be used e.g. to limit the result of the command kubectl get:


$ kubectl get pod -l importance=great
  NAME                                 READY   STATUS    RESTARTS   AGE
  hashgenerator-dep-7b9b88f8bf-lvcv4   1/1     Running   0          17m
With labels, we can even move pods to labeled nodes. Let's say we have a few nodes which have qualities that we wish to avoid. For example, those might have a slower network. With labels and nodeSelector(opens in a new tab) configured for deployment, we can do just that. First, add a nodeSelector to the deployment and then label the node(s):


    ...
    spec:
      containers:
        - name: hashgenerator
          image: jakousa/dwk-app1:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
      nodeSelector:
        networkquality: excellent
If you already have the pod running, it won't terminate the pod to avoid unwanted changes in the system, instead a new pod is scheduled:


$ kubectl get po
  NAME                                 READY   STATUS    RESTARTS   AGE
  hashgenerator-dep-548d4d6c8d-mbblj   1/1     Running   0          107s
  hashgenerator-dep-7586cb6456-mktcl   0/1     Pending   0          23s
The status of the new pod is "Pending" since there are no nodes with excellent network quality yet.

We know that the node k3d-k3s-default-agent-1 is one with excellent network quality. Let us label that so that Kubernetes will know where the pod is able to run:


$ kubectl label nodes k3d-k3s-default-agent-1 networkquality=excellent
  node/k3d-k3s-default-agent-1 labeled

$ kubectl get po
  NAME                                 READY   STATUS    RESTARTS   AGE
  hashgenerator-dep-7b9b88f8bf-mktcl   1/1     Running   0          5m30s
nodeSelector is a blunt tool. It's great when you want to define binary qualities, like "don't run this application if the node is using an HDD instead of an SSD" by labeling the nodes according to disk types. There are more sophisticated tools you should use when you have a cluster of various machines, ranging from a fighter jet(opens in a new tab) to a toaster to a supercomputer. Kubernetes can use affinity(opens in a new tab) and anti-affinity to select which nodes are prioritized for which applications and taints with tolerances(opens in a new tab) so that a pod can avoid certain nodes. For example, if a machine has a high network latency and we wouldn't want it to do some latency-critical tasks.

See affinity and anti-affinity(opens in a new tab) and taints and tolerances(opens in a new tab) for detailed information. We will not be assigning pods to specific nodes on this course, as we have a homogeneous cluster.