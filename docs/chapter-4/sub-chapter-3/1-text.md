GKE features
What you'll learn in this page
Comparig DBaaS to a self hosted solution
Autoscaling pods in the cluster
Autoscale the cluster
Volumes again
Now we arrive at an intersection. We can either start using a Database as a Service (DBaaS) such as the Google Cloud SQL in our case or just use the PersistentVolumeClaims with our own Postgres images and let the Google Kubernetes Engine take care of storage via PersistentVolumes for us.

Both solutions are widely used.