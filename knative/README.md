# knative (exercises 5.6 and 5.7)

Serverless on the local k3d cluster: Knative Serving with Kourier as the network layer and Magic
DNS (`sslip.io`) for automatic hostnames.

## Install

```bash
V=knative-v1.18.0
kubectl apply -f https://github.com/knative/serving/releases/download/$V/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/$V/serving-core.yaml
kubectl apply -f https://github.com/knative/net-kourier/releases/download/$V/kourier.yaml
kubectl patch configmap/config-network -n knative-serving --type merge \
  -p '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'
kubectl apply -f https://github.com/knative/serving/releases/download/$V/serving-default-domain.yaml
```

The cluster has Traefik disabled (the Knative prerequisites ask for it) and the Kourier gateway is
reached through a port-forward in this setup.

### Local images

Knative resolves every image tag to a digest against Docker Hub, which fails for images that only
exist in the local containerd store:

```
Unable to fetch image "greeter:v1": failed to resolve image to digest:
HEAD https://index.docker.io/v2/library/greeter/manifests/v1: 401 Unauthorized
```

Telling the controller to skip digest resolution for Docker Hub makes the local images usable:

```bash
kubectl patch configmap/config-deployment -n knative-serving --type merge \
  -p '{"data":{"registries-skipping-tag-resolving":"index.docker.io,docker.io"}}'
kubectl -n knative-serving rollout restart deployment/controller
```

## 5.6 Trying serverless

`hello.yaml` is a Knative Service with `min-scale: 0` and `max-scale: 3`. `hello-split.yaml`
creates a second revision and splits the traffic 50/50 between them.

```bash
kubectl apply -f hello.yaml
kubectl get ksvc -n default                 # http://hello.default.<ip>.sslip.io
kubectl apply -f hello-split.yaml
kubectl get revision -n default
```

Verified:

- The first request returns `hello from v1` through the Kourier gateway
  (`kubectl -n kourier-system port-forward svc/kourier 8110:80` and the `Host` header from
  `kubectl get ksvc`).
- `hello-00001` scaled to `0` replicas while `hello-00002` took the traffic, which is the
  scale-to-zero behaviour.
- Twenty requests after the split returned 12 × `v1` and 8 × `v2`, i.e. the 50/50 revision split.

## 5.7 Deploy to serverless

`pingpong.yaml` turns the ping-pong counter into a Knative Service in the `exercises` namespace,
and the "Log output" reader calls it through the fully qualified name instead of the Service name:

```
PING_URL=http://pingpong.exercises.svc.cluster.local
```

Verified: `kubectl get ksvc -n exercises` shows `pingpong` ready, and the Log output application
keeps returning the counter from the serverless revision:

```
file content: this text is from file
env variable: MESSAGE=hello world
2026-11-08T07:15:59.366Z: c6784ef4-d9da-4c41-996c-fd849ebf2373
Ping / Pongs: 2047
Greetings: hello from v2
```

The Knative Service keeps the PostgreSQL connection through the `postgres-svc` headless Service, so
the counter survives revision changes.
