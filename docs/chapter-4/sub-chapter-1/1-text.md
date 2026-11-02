Introduction to Google Kubernetes Engine
What you'll learn in this page
Creating cluster in GKE
Deploying applications to Google Kubernetes Engine
We have used the Kubernetes distribution K3s using Docker containers via k3d. In a production environment, the burden of maintaining a Kubernetes cluster is often left to third parties. A managed Kubernetes as a service is often the best choice, as the additional work required in maintenance exceeds the benefits of a personal cluster. In some rare cases, setting up and maintaining your own cluster is a reasonable option. A case for it would be that your company/organization already has the hardware and/or wants to stay independent from providers, one such example could be a University. Another primary reason for operating your own Kubernetes cluster is that regulations rule out all other choices.

Maintaining your own Kubernetes cluster is one way to increase costs. The other is running servers that are not in use. To avoid costs Serverless(opens in a new tab) solutions could be more cost-efficient. A Kubernetes cluster of improper size can get really expensive pretty fast. An excellent option to start out with would be a high-tier environment for serverless workloads, such as Google Cloud Run or AWS Fargate. In those you can run any container, compared to older solutions like Cloud Functions or AWS Lambda, which have wildly varying support for different languages, environments, and tooling.

Let's focus on the Google Kubernetes Engine (GKE) costs for now. Note that the GKE costs a little bit more than its competitors.

The calculator here https://cloud.google.com/products/calculator(opens in a new tab) offers us a picture of the pricing. I decided to try a cheap option: 5 nodes in 1 zonal cluster using 1 vCPU each. The datacenter location is in Finland, and I don't need a persistent disk. If we wanted fewer than 5 nodes, why would we even use Kubernetes? The total cost for this example was around 180 USD per month. Adding additional services, such as a database and a load balancer, increases the cost. If you find the billing for Google Cloud Platform confusing, you're not alone: Coursera has a 5-hour course for "Understanding Your Google Cloud Platform Costs(opens in a new tab)".

During this Chapter, we will be using GKE with the free credits offered by Google. You are responsible for making sure that the credits last for the whole part, and if all of them are consumed, I can not help you.

After redeeming the credits, we can create a project with the billing account. The Google Cloud UI can be confusing. On the welcome page we can create a new project and name it "dwk-gke" for the purposes of this course.

Install the Google Cloud SDK. Instructions here(opens in a new tab). After that, log in and set the previously created project to be used. See the project ID from the welcome page!


$ gcloud -v
  Google Cloud SDK 569.0.0
  bq 2.1.31
  core 2026.05.15
  gcloud-crc32c 1.0.0
  gke-gcloud-auth-plugin 0.5.14
  gsutil 5.37

$ gcloud auth login
  ...
  You are now logged in

$ gcloud config set project dwk-gke-idhere
  Updated property [core/project].
We can now create a cluster with the command gcloud container clusters create(opens in a new tab). You can choose any zone you want from the list here(opens in a new tab). I chose Finland. Notice that one region (e.g., europe-north1) may have multiple regions (e.g., a). Let's add another flag: --cluster-version=1.36. This will ask GKE to use a version that will be the default in May 2026. The GKE release schedule can be seen here(opens in a new tab).

Let us try creating the cluster:


$ gcloud container clusters create dwk-cluster --zone=europe-north1-b --cluster-version=1.36 --disk-size=32 --num-nodes=4 --machine-type=e2-small

ERROR: (gcloud.container.clusters.create) ResponseError: code=403, message=Kubernetes Engine API has not been used in project dwk-gke-xxxxxx before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/container.googleapis.com/overview?project=dwk-gke-xxxxxx then retry.
Creation fails. You can visit the link that was provided and enable the Kubernetes Engine API, just note that the URL which is outputted is specific to your project name. Or, you can just execute the following command on the CLI:


$ gcloud services enable container.googleapis.com
  Operation "operations/acf.p2-385245615727-2f855eed-e785-49ac-91da-896925a691ab" finished successfully.

$ gcloud container clusters create dwk-cluster --zone=europe-north1-b --cluster-version=1.36 --disk-size=32 --num-nodes=4 --machine-type=e2-small
  ...
  Creating cluster dwk-cluster in europe-north1-b...
  ...
  kubeconfig entry generated for dwk-cluster.
  NAME         LOCATION         MASTER_VERSION   MASTER_IP       MACHINE_TYPE  NODE_VERSION     NUM_NODES  STATUS
  dwk-cluster  europe-north1-b  1.29.8-gke.2200  35.228.176.118  e2-medium     1.29.8-gke.2200  3          RUNNING
If the command does not work, you need to install gke-gcloud-auth-plugin by following this(opens in a new tab).

The installation takes some minutes, so be patient! The installation should set the kubeconfig to point to the newly created cluster. You can check the cluster info with kubectl cluster-info to see if the configuration is right:


$ kubectl cluster-info
Kubernetes control plane is running at https://35.238.53.231
GLBCDefaultBackend is running at https://35.238.53.231/api/v1/namespaces/kube-system/services/default-http-backend:http/proxy
KubeDNS is running at https://35.238.53.231/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
Metrics-server is running at https://35.238.53.231/api/v1/namespaces/kube-system/services/https:metrics-server:/proxy
If you still see the URLs looking something like the below, the configuration is still pointing to your local cluster:


$ kubectl cluster-info
Kubernetes control plane is running at https://0.0.0.0:62698
CoreDNS is running at https://0.0.0.0:62698/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
Metrics-server is running at https://0.0.0.0:62698/api/v1/namespaces/kube-system/services/https:metrics-server:https/proxy
In which case we can set up kubeconfig to point to the new cluster like this:


$ gcloud container clusters get-credentials dwk-cluster --zone=europe-north1-b
  Fetching cluster endpoint and auth data.
  kubeconfig entry generated for dwk-cluster.
Lost in the Google Cloud?
You are not alone. Fortunately, the Google Cloud Console has introduced a Gemini-based Cloud Assistant that can help you to navigate your way around the Cloud. It is fairly good, but of course quite dependent on the way you formulate the prompts. I have had some success with it, I for example managed to find out how to see the logs of my app:

Add alt
Deploying to GKE
The cluster we have now is almost like the one we had locally. Let's apply this(opens in a new tab) application that creates a random string and then serves an image based on that random string. This will create 6 replicas of the process "seedimage".


$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/e11a700350aede132b62d3b5fd63c05d6b976394/app6/manifests/deployment.yaml
Exposing the service is where the differences start. Instead of an Ingress we'll use LoadBalancer(opens in a new tab) service. Now as a warning the next step is going to add into the cost of the cluster(opens in a new tab) as well.

Apply the following file service.yaml:


apiVersion: v1
kind: Service
metadata:
  name: seedimage-svc
spec:
  type: LoadBalancer # This should be the only unfamiliar part
  selector:
    app: seedimage
  ports:
    - port: 80
      protocol: TCP
      targetPort: 3000
A load balancer service asks for Google services to provision us a load balancer. Let us find out what IP the service is given:


$ kubectl get svc
  NAME            TYPE           CLUSTER-IP      EXTERNAL-IP    PORT(S)        AGE
  kubernetes      ClusterIP      10.31.240.1     <none>         443/TCP        144m
  seedimage-svc   LoadBalancer   10.31.241.224   <pending>  80:30215/TCP   94s
The external IP address is still in a pending state. We can wait until the service gets an external IP, with the option --watch :


$ kubectl get svc --watch
  NAME            TYPE           CLUSTER-IP      EXTERNAL-IP    PORT(S)        AGE
  kubernetes      ClusterIP      10.31.240.1     <none>         443/TCP        144m
  seedimage-svc   LoadBalancer   10.31.241.224   35.228.41.16   80:30215/TCP   94s
After a short wait, we will see the external IP. If we now access http://35.228.41.16 with our browser, we'll see the application up and running. By refreshing the page, we can also see that the load balancer sometimes offers us a different image. Note that this is available on port 80, so HTTPS will not work.

To avoid using up the credits delete the cluster whenever you do not need it


$ gcloud container clusters delete dwk-cluster --zone=europe-north1-b
And when resuming progress create the cluster back with the command shown earlier.

Closing the cluster will also remove everything you've deployed on the cluster. So if you decide to take a days long break during an exercise, you may have to redo it. Thankfully we are using a declarative approach so continuing progress will only require you to apply the yamls.

Persisting data in GKE
Google Kubernetes Engine will automatically provision a persistent disk for your PersistentVolumeClaim(opens in a new tab) - just don't set the storage class. If you want you can read more about it here(opens in a new tab).