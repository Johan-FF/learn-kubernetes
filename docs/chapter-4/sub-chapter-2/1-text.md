Deployment Pipeline
What you'll learn in this page
Create deployment pipeline to GKE with Github Actions
Enabling continuous delivery from a git push to production
Let's setup a deployment pipeline using GitHub actions. We just need something to deploy so let's create a new website.

Create a Dockerfile with the following contents:


FROM nginx:1.31-alpine

COPY index.html /usr/share/nginx/html
and add index.html with the following content


<!DOCTYPE html>
<html>
  <body style="background-color: gray;">
    <p>
      Content
    </p>
  </body>
</html>
Let's make sure that everything works by doing docker build . -t colorcontent && docker run -p 3000:80 colorcontent to build and run it and then accessing it through http://localhost:3000(opens in a new tab).

Next is the addition of manifests for our website manifests/service.yaml looks as follows:


apiVersion: v1
kind: Service
metadata:
  name: dwk-environments-svc
spec:
  type: LoadBalancer
  selector:
    app: dwk-environments
  ports:
    - port: 80
      protocol: TCP
      targetPort: 80
There are no surprises in manifests/deployment.yaml:


apiVersion: apps/v1
kind: Deployment
metadata:
  name: dwk-environments
spec:
  replicas: 1
  selector:
    matchLabels:
      app: dwk-environments
  template:
    metadata:
      labels:
        app: dwk-environments
    spec:
      containers:
        - name: dwk-environments
          image: jakousa/colorcontent
Next, to test our manifests deploy this into our cluster. Above I had pushed the built image using docker push.


kubectl apply -f manifests/service.yaml
kubectl apply -f manifests/deployment.yaml
Kustomize
Applying multiple files like this gets bothersome. We can of course point it at a directory like so: kubectl apply -f manifests/, but kubernetes will apply them in lexical (alphabetical) order. This means config map will be created before namespaces and if your config map reference a nonexistence namespace, you get an error (same issue with ingess and services). This makes it an excellent moment to turn our attention to Kustomize.

Kustomize(opens in a new tab) is a tool that helps with configuration customization and is baked into kubectl. In this case we'll use it to define which files are meaningful for Kubernetes. Alternatively, we could use Helm and maybe Helmsman(opens in a new tab), but we will leave that outside of the context of this course.

Let us now follow the common practice and add the configuration file kustomization.yaml, in the root of the project. The kustomization.yaml should include instructions on how to use the deployment.yaml and service.yaml:


apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - manifests/deployment.yaml
  - manifests/service.yaml
Now we can deploy this using the -k flag identifying that we want to use Kustomize:


$ kubectl apply -k .
Just one command to do it all, this is nice!

Sometimes it can be very useful to see what Kustomize would do without applying it to the cluster. That can be done with the command kubectl kustomize . that just dumps the resulting yaml to the screen.

Kustomize will be an essential tool for our deployment pipeline. It'll allow us for example to individually choose which image to use. For this, let's declare the image inside the kustomization.yaml:


# ...
images:
  - name: PROJECT/IMAGE
    newName: jakousa/colorcontent
This will replace the image "IMAGE:TAG" with the one defined in newName. Next setting a placeholder value inside the deployment.yaml for the image:


# ...
containers:
  - name: dwk-environments
    image: PROJECT/IMAGE
Let us test that everything works:


$ kubectl kustomize .
  ...
    spec:
      containers:
      - image: jakousa/colorcontent
        name: dwk-environments
The documentation of Kustomize in probably not the best one around. You will find more or less useful stuff by Google. One that you might want to check out is Kustomize Cheat Sheet(opens in a new tab).