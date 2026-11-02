Organizing a cluster
What you'll learn in this page
the methods for organizing a cluster
constraining pods to specific nodes
As you can imagine, there may be a lot of resources inside a cluster. In fact, at the moment of writing this Kubernetes supports over 100 000 pods in a single cluster.

Namespaces
Namespaces(opens in a new tab) are used to keep resources separated. A company that uses one cluster but has multiple projects can use namespaces to split the cluster into virtual clusters, one for each project. Most commonly they would be used to separate environments such as production, testing, staging. DNS entry for services includes the namespace so you can still have projects communicate with each other if needed through service.namespace address. e.g. if a service called cat-pictures is in a namespace ns-test, it could be found from other namespaces via http://cat-pictures.ns-test(opens in a new tab).

Accessing namespaces with kubectl is achieved by using the -n flag. For example, you can see what the namespace kube-system has with


$ kubectl get pods -n kube-system
To see everything you can use --all-namespaces.


$ kubectl get all --all-namespaces
Namespaces should be kept separate - you could e.g. run all of the examples and do the exercises of this course in a cluster that is shared with critical software, but that would not be a smart thing to do. An administrator should set a ResourceQuota(opens in a new tab) for that namespace, so that you can safely run anything there. We'll look into resource limits and requests later.

Creating a namespace is a oneliner:


kubectl create namespace example-namespace
You can define the namespace to use by adding it to the metadata section of the yaml files:


# ...
metadata:
  namespace: example-namespace
  name: example
# ...
If you're using a specific namespace constantly, you can set the namespace to be used by default with kubectl config set-context --current --namespace=<name>.

Changing the default namespace with the above command is a pain. Fortunately, there is a community-created tool kubens, that makes listing existing namespaces and changing the default easy. Install now kubectx + kubens(opens in a new tab) that has besides kubens the command kubectx for changing the cluster you are using. The command kubectx turns out to be extremely handy when we are creating another cluster in Chapter 4 to Google Kubernetes Engine.

Watch now video Kubernetes Best Practices - Organizing Kubernetes with Namespaces that summazies nicely how namespaces could be utilized.

