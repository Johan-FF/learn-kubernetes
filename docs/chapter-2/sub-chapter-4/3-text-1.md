Persistent Volumes
In contrast to the emptyDir volumes, a Persistent Volume(opens in a new tab) is something you probably had in mind when we started talking about volumes.

A Persistent Volume (PV) is a cluster-wide resource that represents a piece of storage in the cluster that has been provisioned by the cluster administrator or is dynamically(opens in a new tab) provisioned. Persistent Volumes can be backed by various types of storage such as local disk, NFS, cloud storage, etc.

PVs have a lifecycle independent of any individual pod that uses the PV. This means that the data in the PV can outlive the pod that it was attached to.

When using a cloud provider, such as Google Kubernetes Engine which we shall use in Chapters 4 and 5, it is the cloud provider that takes care of backing storage and the Persistent Volumes that you can use. If you run your own cluster or use a local cluster such as k3s for development, you need to take care of the storage system and Persistent Volumes by yourself.

An easy option that we can use with K3s is a local(opens in a new tab) PersistentVolume that uses a path in a cluster node as the storage. This solution ties the volume to a particular node and if the node becomes unavailable, the storage is not usable.

So the local Persistent Volumes are not the solution to be used in production!

For the PersistentVolume to work you first need to create the local path in the node we are binding it to. Since our cluster runs via Docker let's create a directory at /tmp/kube in the container k3d-k3s-default-agent-0. This can simply be done via docker exec k3d-k3s-default-agent-0 mkdir -p /tmp/kube

The Persistent Volume definition is created in file persistentvolume.yaml as follows:


apiVersion: v1
kind: PersistentVolume
metadata:
  name: example-pv
spec:
  storageClassName: my-example-pv # this is the name you are using later to claim this volume
  capacity:
    storage: 1Gi # Could be e.q. 500Gi. Small amount is to preserve space when testing locally
  volumeMode: Filesystem # This declares that it will be mounted into pods as a directory
  accessModes:
  - ReadWriteOnce
  local:
    path: /tmp/kube
  nodeAffinity: ## This is only required for local, it defines which nodes can access it
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - k3d-k3s-default-agent-0
In order to use a persistent volume, you must make a Persistent Volume Claim(opens in a new tab) (PVC), which is a request for the storage.

When a user creates a PVC, Kubernetes finds an appropriate PV that satisfies the claim's requirements and binds them together. If no PV is available, depending on the configuration, the cluster might dynamically create a PV that meets the claim's needs.

Once bound, the PersistentVolumeClaim is "locked" and can only be used by one Pod (depending on the access mode specified). This ensures that the PV resource is exclusively used by the pod it's bound to.

If there is no suitable Persistent Volume available, the PVC will stay in the "Pending" state, waiting for a suitable PV.

Conceptually, you can think of PVs as the physical volume (the actual storage in your infrastructure), whereas PVCs are the means by which pods claim this storage for their use.

Let us now create a claim for our app in file persistentvolumeclaim.yaml:


apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: image-claim # name of the volume claim, this will be used in the deployment
spec:
  storageClassName: my-example-pv # this is the name of the persistent volume we are claiming
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
Modify the previously introduced deployment to use it:

Highlighted lines: 5 to 6
# ...
    spec:
      volumes:
        - name: shared-image
          persistentVolumeClaim:
            claimName: image-claim
      containers:
        - name: image-finder
          image: jakousa/dwk-app3-image-finder:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
          volumeMounts:
          - name: shared-image
            mountPath: /usr/src/app/files
        - name: image-response
          image: jakousa/dwk-app3-image-response:b7fc18de2376da80ff0cfc72cf581a9f94d10e64
          volumeMounts:
          - name: shared-image
            mountPath: /usr/src/app/files
And apply it with persistentvolume.yaml and persistentvolumeclaim.yaml.


$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app3/manifests/deployment-persistent.yaml
With the previous service and ingress, we can access the app in http://localhost:8081(opens in a new tab). To confirm that the data is persistent we can run


$ kubectl delete -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app3/manifests/deployment-persistent.yaml
  deployment.apps "images-dep" deleted
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app3/manifests/deployment-persistent.yaml
  deployment.apps/images-dep created
The same file is available again!

If you are interested in learning more about running your own storage you can check out eg. the following:

Rook(opens in a new tab)
OpenEBS(opens in a new tab)
Longhorn(opens in a new tab)
Exercise: