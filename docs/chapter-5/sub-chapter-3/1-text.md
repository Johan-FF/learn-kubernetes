GitOps
What you'll learn in this page
Comparing GitOps to other deployment methods
Comparing traditional push deployment to a pull deployment
Implement GitOps in your Kubernetes cluster with ArgoCD
An average simple deployment pipeline includes the following steps:

Developer pushes modified code to a repository, such as GitHub.
This triggers a CI/CD service, like GitHub Actions, to start running.
The CI/CD service runs tests, builds an image, pushes the image to a registry, and deploys the new image, for example, to Kubernetes.
This is called a push deployment. It is a descriptive name as everything is pushed forward by the previous step. There are some challenges with the push approach. For example, if we have a Kubernetes cluster that is unavailable for external connections i.e. the cluster on your local machine or any cluster we don't want to give outsiders access to. In those cases having CI/CD push the update to the cluster is not possible.

In a pull configuration the setup is reversed. We can have the cluster, running anywhere, pull the new image and deploy it automatically. The new image will still be tested and built by the CI/CD. We simply relieve the CI/CD of the burden of deployment and move it to another system that is doing the pulling.

Watchtower
If you completed DevOps with Docker you may have heard about watchtower(opens in a new tab) which enabled us to change the last pushes of a deployment pipeline to pulls when running services with docker compose.

GitOps is all about this reversal and promotes good practices for the operations side of things. This is achieved by maintaining the state of the cluster in a Git repository, thereby handling not only application deployments but also all changes to the cluster. This will require some additional configuration and rethinking past the tradition of server configuration. But when we get there, GitOps will be the final nail in the coffin of imperative cluster management.

ArgoCD(opens in a new tab) is the current leading tool for GitOps in Kubernetes, and also our choice. At the end our workflow should look like this:

Developer runs git push with modified code or configurations.
CI/CD service (GitHub Actions in our case) starts running.
CI/CD service builds and pushes new image and commits edit to the "release" branch (main in our case)
ArgoCD will take the state described in the release branch and set it as the state of our cluster.
Let us start by installing ArgoCD by following the Getting started(opens in a new tab) of the docs:


kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
Now ArgoCD is up and running in our cluster. We still need to open access to it. There are several options(opens in a new tab). We shall use the LoadBalancer. So we'll give the command


kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
After a short wait, the cluster has provided us with an external IP:


$ kubectl get svc -n argocd
NAME               TYPE           CLUSTER-IP    EXTERNAL-IP   PORT(S)                      AGE
...
argocd-server      LoadBalancer   10.7.5.82     34.88.152.2   80:32029/TCP,443:30574/TCP   17min
The initial password for the admin account is auto-generated and stored as clear text in the field password in a secret named argocd-initial-admin-secret in your Argo CD installation namespace. So we get it by base64 decoding the value that we get with the command


kubectl get -n argocd secrets argocd-initial-admin-secret -o yaml
We can now login:

Add alt
Let us now deploy the simple app in https://github.com/mluukkai/dwk-app1(opens in a new tab) using ArgoCD. Fork the repository, if you want to follow the example!

We start by clicking Create application and fill the form that opens:

Add alt
At the start, we decided to have a manual sync policy.

Add alt
Note that since the definition (in our case, file kustomization.yaml) is in the repository root, we have defined the path to have the value ., that is, the character period.

The app is created but it is missing and not in sync, since we selected the manual sync policy:

Add alt
Let us sync it and go to the app page:

Add alt
Something seems to be wrong, the pod has a broken heart symbol. We could now start our usual debugging process starting with kubectl get po. We see the same info from ArgoCD by clicking the pod:

Add alt
Ok, we have specified an image that does not exist. Let us fix it in GitHub by changing kustomization.yaml as follows:


apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- manifests/deployment.yaml
- manifests/service.yaml
images:
- name: PROJECT/IMAGE
  newName: mluukkai/dwk1
When we sync the changes in ArgoCD, a new healthy pod is started and our app is up and running!

We can check the external IP either from command line with kubectl or clicking the service:

Add alt
Let us now change the sync mode to automatic by clicking the Details from the app page in ArgoCD.

Now all the configuration changes that we make to GitHub should be automatically applied by ArgoCD. Let us scale up the deployment to have 5 pods:


apiVersion: apps/v1
kind: Deployment
metadata:
  name: dwk1-app-dep
spec:
  replicas: 5
  selector:
    matchLabels:
      app: dwk1-app
  template:
    ...
After a small wait (the default sync frequency of ArgoCD is 180 seconds), app gets synchronized and 5 pods are up and running:

Add alt
Besides services, deployments and pods, the app configuration tree shows also some other objects. We see that there is a ReplicaSet(opens in a new tab) (in figure rs) in between deployment and the pods. A ReplicaSet is a Kubernetes object that ensures there is always a stable set of running pods for a specific workload. The ReplicaSet configuration defines a number of identical pods required, and if a pod is evicted or fails, creates more pods to compensate for the loss. Users do not usually define ReplicaSets directly, instead Deployments are used. A Deployment then creates a ReplicaSet that takes care of running the pod replicas.

The changes in app Kubernetes configurations that we make to GitHub are now nicely synched to the cluster. How about the changes in the app?

In order to deploy a new app version, we should change the image that is used in the deployment. Currently the image is defined in the file kustomization.yaml:


apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- manifests/deployment.yaml
- manifests/service.yaml
images:
- name: PROJECT/IMAGE
  newName: mluukkai/dwk1
So to deploy a new version of the app, we should:

create a new image with possibly a new tag
change the kustomization.yaml to use the new image
push changes to GitHub
Surely this could be done manually but that is not enough for us. Let us now define a GitHub Actions workflow that does all these steps.

The first step is already familiar to us from the previous Chapter.

The step 2 can be done with the command kustomize edit:


$ kustomize edit set image PROJECT/IMAGE=node:20
$ cat kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- manifests/deployment.yaml
- manifests/service.yaml
images:
- name: PROJECT/IMAGE
  newName: node
  newTag: "20"
As we see, the command changes the file kustomization.yaml. So all that is left is to commit the file to the repository. Fortunately there is a ready made GitHub Action add-and-commit(opens in a new tab) for that!

The workflow looks the following:


name: Build and publish application

on:
  push:

jobs:
  build-publish:
    name: Build, Push, Release
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Login to Docker Hub
        uses: docker/login-action@v4
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # tag image with the GitHub SHA to get a unique tag
      - name: Build and publish backend
        run: |-
          docker build --tag "mluukkai/dwk1:$GITHUB_SHA" .
          docker push "mluukkai/dwk1:$GITHUB_SHA"

      - name: Set up Kustomize
        uses: imranismail/setup-kustomize@v3

      - name: Use right image
        run: kustomize edit set image PROJECT/IMAGE=mluukkai/dwk1:$GITHUB_SHA

      - name: commit kustomization.yaml to GitHub
        uses: EndBug/add-and-commit@v10
        with:
          add: 'kustomization.yaml'
          message: New version released ${{ github.sha }}
There is still one more to do, from the repository settings we must give the GitHub Actions permission to write to our repository:

Add alt
We are now set, all changes to configurations and to the app code are now deployed to our cluster automatically by ArgoCD with the help of our GitHub Action workflow, so nice!