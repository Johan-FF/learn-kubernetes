More environments
If an app has many environments such as production, staging and testing, a straightforward way of defining the environments contains lots of copy-paste. When Kustomize is used, the recommended(opens in a new tab) way is to define a common base for all the environments and then environment specific overlays where the differing parts are defined.

Let us look at a simple example. We will create a directory structure that looks like the following:


.
├── base
│   ├── deployment.yaml
│   └── kustomization.yaml
└── overlays
    ├── prod
    │   ├── deployment.yaml
    │   └── kustomization.yaml
    └── staging
        └── kustomization.yaml
The base/deployment.yaml is as follows


apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-dep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: PROJECT/IMAGE
The base/kustomization.yaml is simple:


apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- deployment.yaml
The production environment refines the base by changing the replica count to 3. The overlays/prod/deployment.yaml looks like this:


apiVersion: apps/v1
kind: Deployment
metadata:
  name: dep
spec:
  replicas: 3
So only parts that are different are defined.

The overlays/prod/kustomization.yaml looks like following:


apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ./../../base
patches:
  - path: deployment.yaml

namePrefix: prod-

images:
  - name: PROJECT/IMAGE
    newName: nginx:1.31-alpine
So it refers to the base and patches(opens in a new tab) that with the above deployment that sets the number of replicas to 3.

The overlays/staging/kustomization.yaml just sets the image:


apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- ./../../base
namePrefix: staging-

images:
  - name: PROJECT/IMAGE
    newName: nginx:1.31-bookworm
Now the production and staging can be deployed using ArgoCD by pointing to the corresponding overlay directories.

Defining the whole with yaml
So far, we have used the ArgoCD UI to define applications. There are also other options. One is to install(opens in a new tab) and use Argo CLI(opens in a new tab).

Yet another option is to use declarative(opens in a new tab) approach and do the definition with Application(opens in a new tab) Custom resource definition, that is a Kubernetes resource object representing a deployed application instance in an environment. The Application object defines both the source that is the Git repository of the project, and the destination in the cluster where the app will be deployed.

For the production version of our app the definition in the file application.yaml looks like this:


apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/mluukkai/gitopstest
    path: overlays/prod
    targetRevision: HEAD
  destination:
    server: https://kubernetes.default.svc
    namespace: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
The application is then set up to ArgoCD by applying the definition:


kubectl apply -n argocd -f application.yaml
With GitOps we achieve the following:

Better security
Nobody needs access to the cluster, not even CI/CD services. No need to share access to the cluster with collaborators; they will commit changes like everyone else.
Better transparency
Everything is declared in the GitHub repository. When a new person joins the team, he/she can check the repository; no need to pass ancient knowledge or hidden techniques as there are none.
Better traceability
All changes to the cluster are version controlled. You will know exactly what was the state of the cluster and how it was changed and by whom.
Risk reduction
If something breaks simply revert the cluster to a working commit. git revert and the whole cluster is in a previous state.
Portability
Want to change to a new provider? Spin up a cluster and point it to the same repository - your cluster is now there.
There are a few options for the GitOps setup. What we used here was having the configuration for the application in the same repository as the application itself. Another option is to have the configuration separate from the source code. ArgoCD lists many convincing arguments that the use of separate repos is a best practice(opens in a new tab).

Exercise: