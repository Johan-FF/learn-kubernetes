Declarative configuration with YAML
We created the deployment with


$ kubectl create deployment hashgenerator-dep --image=jakousa/dwk-app1
If we need to scale it 4 times and update the image, the following commands can be given:


$ kubectl scale deployment/hashgenerator-dep --replicas=4

$ kubectl set image deployment/hashgenerator-dep dwk-app1=jakousa/dwk-app1:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
Things start to get really cumbersome. It is hard to imagine how someone in their right mind could be maintaining multiple applications like that. Thankfully we will now use a declarative approach where we define how things should be rather than how they should change. This is more sustainable in the long run than the imperative approach and will let us keep our sanity.

Before redoing the previous steps via the declarative approach, let's take the existing deployment down.


$ kubectl delete deployment hashgenerator-dep
  deployment.apps "hashgenerator-dep" deleted
and create a new folder named manifests and place a file called deployment.yaml with the following contents (you can check the example here(opens in a new tab)
) there:


apiVersion: apps/v1kind: Deploymentmetadata:
  name: hashgenerator-depspec:
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

The created file looks a lot like the docker-compose.yaml files we have previously written. Let's ignore what we don't know for now, which is mainly labels, and focus on the things that we know:

- kind: Deployment declares what kind, or type the created object has
- name: hashgenerator-dep gives a name as metadata
- replicas: 1 declaring that there should be one pod to run the containers
- We're also declaring that it has a container that is from a certain image with a name
Apply the deployment with apply command:


$ kubectl apply -f manifests/deployment.yaml
  deployment.apps/hashgenerator-dep created
That's it, but for the sake of revision, let's delete it and create it again:


$ kubectl delete -f manifests/deployment.yaml
  deployment.apps "hashgenerator-dep" deleted

$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app1/manifests/deployment.yaml
  deployment.apps/hashgenerator-dep created
Woah! The fact that you can apply manifest from the internet just like that will come in handy.

Instead of deleting the deployment, we could just apply a modified deployment on top of what we already have. Kubernetes will take care of rolling out a new version. By using tags (e.g. dwk/image:tag) in the deployments, each time we update the image we can modify and apply the new deployment yaml. Previously you may have always used the 'latest' tag, or not thought about tags at all. From the tag Kubernetes will know that the image is a new one and pulls it.

When updating anything in Kubernetes the usage of delete is actually an anti-pattern and you should use it only as the last option. As long as you don't delete the resource Kubernetes will do a rolling update, ensuring minimum (or none) downtime for the application. On the topic of anti-patterns: you should also always avoid doing anything imperatively! If your files don't tell Kubernetes and your team what the state should be and instead you run commands that edit the state you are just lowering the bus factor(opens in a new tab)
 for your cluster and application.

Text editor of choice

I personally use Visual Studio Code to create yaml files. It has helpful autofill, definitions, and syntax checks for Kubernetes with the extension Kubernetes by Microsoft. Even now it helpfully warns us that we haven't defined resource limitations. I won't care about that warning yet, but you can figure it out if you want to.

GitHub copilot can also be quite useful in helping with yaml creation.