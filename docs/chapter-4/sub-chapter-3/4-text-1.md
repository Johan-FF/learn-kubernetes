Scaling
Scaling is essential for maintaining optimal performance and reliability in a system as demand fluctuates. It ensures that applications can handle varying loads efficiently, preventing downtime and maintaining user satisfaction.

There are two primary types of scaling: horizontal scaling and vertical scaling. Vertical scaling involves increasing the resources available to a single pod or node, such as adding more CPU or memory. This approach enhances the capacity of individual units.

Horizontal scaling, which is more commonly discussed, involves increasing the number of pods or nodes. This method distributes the load across multiple units, enhancing the system's ability to handle higher traffic and providing redundancy.

We will now focus on horizontal scaling and its benefits.

Scaling pods
There are multiple reasons for scaling an application. The most common reason is that the number of requests an application receives exceeds the number of requests that can be processed. Limitations are often either the amount of requests that a framework is intended to handle or the actual CPU or RAM.

I've prepared an application(opens in a new tab) that is rather CPU-intensive. There is a readily compiled Docker image jakousa/dwk-app7:e11a700350aede132b62d3b5fd63c05d6b976394. The application accepts a query parameter ?fibos=25 that is used to control how long the computation is. You should use values between 15 and 30.

Note that if your cluster consists of inefficient nodes, such as e2-small instances, there might not be enough memory to run the example below. I had to install some e2-medium instances to get through the example.

Here is the deployment.yaml to get the app up and running:


apiVersion: apps/v1
kind: Deployment
metadata:
  name: cpushredder-dep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: cpushredder
  template:
    metadata:
      labels:
        app: cpushredder
    spec:
      containers:
        - name: cpushredder
          image: jakousa/dwk-app7:e11a700350aede132b62d3b5fd63c05d6b976394
          resources:
            limits:
              cpu: "150m"
              memory: "100Mi"
Note that finally, we have set the resource limits(opens in a new tab) for a Deployment as well. The suffix of the CPU limit "m" stands for "thousandth of a core". Thus 150m equals 15% of a single CPU core (150/1000=0,15).

The service, defined in the file service.yaml looks familiar by now:


apiVersion: v1
kind: Service
metadata:
  name: cpushredder-svc
spec:
  type: LoadBalancer
  selector:
    app: cpushredder
  ports:
    - port: 80
      protocol: TCP
      targetPort: 3001
Next, we have HorizontalPodAutoscaler(opens in a new tab). This is an exciting new resource for us to work with, let us now create the file horizontalpodautoscaler.yaml with the following content:


apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
metadata:
  name: cpushredder-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cpushredder-dep
  minReplicas: 1
  maxReplicas: 6
  targetCPUUtilizationPercentage: 50
HorizontalPodAutoscaler automatically scales pods horizontally. The YAML here defines what the target Deployment is and what the minimum and maximum replica count are. The target CPU Utilization is defined as well. If the CPU utilization exceeds the target, then an additional replica is created until the maximum number of replicas is reached.

Let us now try what happens:


$ kubectl top pod -l app=cpushredder
  NAME                               CPU(cores)   MEMORY(bytes)
  cpushredder-dep-85f5b578d7-nb5rs   1m           20Mi

$ kubectl get hpa
  NAME              REFERENCE                    TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
  cpushredder-hpa   Deployment/cpushredder-dep   0%/50%    1         6         1          62s

$ kubectl get svc
  NAME              TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)        AGE
  cpushredder-svc   LoadBalancer   10.31.254.209   35.228.149.206   80:32577/TCP   94s
Opening the external-ip, above http://35.228.149.206(opens in a new tab), in your browser will start one process that will take some CPU. Refresh the page a few times and you should see that if you request above the limit the pod will be taken down.


$ kubectl logs -f cpushredder-dep-85f5b578d7-nb5rs
  Started in port 3001
  Received a request
  started fibo with 20
  Received a request
  started fibo with 20
  Fibonacci 20: 10946
  Closed
  Fibonacci 20: 10946
  Closed
  Received a request
  started fibo with 20
After a few requests, you'll see the HorizontalPodAutoscaler spin up a new replica as CPU utilization climbs. Because resource usage can spike sharply during pod startup or shutdown, the HPA waits 5 minutes between scale-down attempts by default. This stabilization window prevents premature downscaling.

If your application shows multiple replicas even at low utilization (e.g., 0%/50%), just wait it out. Setting the cooldown period too short can cause the replica count to oscillate rapidly, a problem known as "thrashing."

I recommend opening the cluster in Lens, just refreshing the page, and looking at what happens in the cluster. If you do not have Lens installed, kubectl get deployments --watch and kubectl get pods --watch show the behavior in real time as well.

By default it will take 300 seconds to scale down. You can change the stabilization window by adding the following to the HorizontalPodAutoscaler:


behavior:
  scaleDown:
    stabilizationWindowSeconds: 30
Figuring out autoscaling with HorizontalPodAutoscalers can be one of the more challenging tasks. Choosing which resources to look at and when to scale is not easy. In our case, we only stress the CPU. But your applications may need to scale based on, and take into consideration, a number of resources e.g. network, disk or memory.

Scaling nodes
Scaling of the number of nodes is a supported feature in GKE. Via the cluster autoscaling feature we can use the right amount of nodes needed. We could e.g. create a cluster with autoscaling that has 1 to 5 nodes as follows:


$ gcloud container clusters update dwk-cluster --zone=europe-north1-b --enable-autoscaling --min-nodes=1 --max-nodes=5
  Updated [https://container.googleapis.com/v1/projects/dwk-gke/zones/europe-north1-b/clusters/dwk-cluster].
  To inspect the contents of your cluster, go to: https://console.cloud.google.com/kubernetes/workload_/gcloud/europe-north1-b/dwk-cluster?project=dwk-gke
For a more robust cluster, see examples on creation here.

Cluster autoscaling may disrupt pods by moving them around as the number of nodes increases or decreases. To solve possible issues with this, the resource PodDisruptionBudget(opens in a new tab) can be used. With the resource, the requirements for a pod can be defined via two of the fields: minAvailable and maxUnavailable:


apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: example-app-pdb
spec:
  maxUnavailable: 50%
  selector:
    matchLabels:
      app: example-app
This configuration would ensure that no more than half of the pods can be unavailable. The Kubernetes documentation states "The budget can only protect against voluntary evictions, not all causes of unavailability."

In addition to scaling to multiple nodes (Horizontal scaling), you can also scale individual nodes with VerticalPodAutoscaler(opens in a new tab). These help ensure you are always using 100% of the resources you pay for.

Before continuing with the exercises, watch the Google video that explains the use of resource limits and resource requests. Video also shows how Kubernetes offers the possibility of limiting resources per namespace. This can, for example, prevent apps in the development namespace from consuming too many resources.