# volumes

Cluster-level storage definitions, kept separate from the applications because
PersistentVolumes are maintained by cluster administrators and are not application specific.

## Contents

| File | Purpose |
| --- | --- |
| `persistentvolume.yaml` | `course-data-pv`, a 100Mi ReadWriteMany hostPath volume pinned to the k3d agent node |
| `persistentvolumeclaim.yaml` | `course-data-pvc`, the claim the applications mount |

## Usage

```bash
kubectl apply -f volumes
kubectl get pv,pvc
```

The volume is a `hostPath` directory (`/tmp/course-data`) inside the k3d agent node, with
`nodeAffinity` so the scheduler only places the consuming pods on that node. The counter of the
"Ping-pong" application and the display of the "Log output" application both live in that
directory, which is why the claim is `ReadWriteMany`.
