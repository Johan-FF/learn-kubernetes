# dummysite

Exercise 5.1: a CRD plus a controller written from scratch, without Operator SDK or Kubebuilder.

## The resource

`crd.yaml` defines `dummysites.dwk.example.com`, namespaced, with a single required field:

```yaml
apiVersion: dwk.example.com/v1
kind: DummySite
metadata:
  name: example
  namespace: dummysite
spec:
  website_url: https://example.com/
```

## The controller

`controller/main.go` is a small Go program that:

1. Reads the in-cluster configuration and builds a typed and a dynamic client.
2. Starts a dynamic informer on `dwk.example.com/v1 dummysites`.
3. On every `Add` event, reads `spec.website_url` and creates
   - a Deployment `dummysite-<name>` whose init container fetches the URL into an `emptyDir`
     that nginx serves, and
   - a Service `dummysite-<name>` exposing it inside the cluster.
4. Sets an owner reference to the DummySite, so deleting the resource deletes the workload too.

`k8s.io/apimachinery` errors are checked with `apierrors.IsAlreadyExists`, so a re-reconcile after
a controller restart is a no-op.

## Apply

```bash
kubectl apply -f crd.yaml
kubectl apply -f deployment.yaml    # creates the dummysite namespace
kubectl apply -f rbac.yaml
kubectl apply -f example.yaml
```

Order matters only in that the namespace must exist before the ServiceAccount.

## Verify

```bash
kubectl get dummysites -n dummysite
kubectl get deployment,service -n dummysite
kubectl port-forward -n dummysite svc/dummysite-example 8099:2345
curl http://127.0.0.1:8099/
```

The page served is the HTML that the init container downloaded from `https://example.com/`.
