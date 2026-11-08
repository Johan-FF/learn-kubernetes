# Resource requests and limits (exercise 3.11)

The values were chosen from observed usage, not guessed. `kubectl top pods -n project` on the GKE
cluster, after the application had been serving requests:

```
NAME                               CPU(cores)   MEMORY(bytes)
todo-app-dep-684df7b8f7-t5c9q      2m           20Mi
todo-backend-dep-564d7f876-5mnms   3m           21Mi
todo-postgres-stset-0              8m           29Mi
```

## Final values

| Workload | CPU request | CPU limit | Memory request | Memory limit | Reasoning |
| --- | --- | --- | --- | --- | --- |
| `todo-app` | `20m` | `100m` | `48Mi` | `128Mi` | Node HTTP server serving an HTML page and proxying the API; uses ~2m CPU and ~20Mi |
| `todo-backend` | `20m` | `100m` | `48Mi` | `128Mi` | One PostgreSQL query per request, pg pool of 5; uses ~3m and ~21Mi |
| `todo-postgres` | `50m` | `200m` | `96Mi` | `256Mi` | PostgreSQL keeps at least ~30Mi plus shared buffers; the limit leaves room for a dump |
| `todo-generator` | `10m` | – | `32Mi` | `128Mi` | Runs once per hour, network bound |
| `todo-backup` | `20m` | – | `64Mi` | `256Mi` | `pg_dump` plus `gsutil`, short lived |

## Why these shapes

- **Requests drive scheduling.** They are set a few times above the observed idle usage so the
  pods fit on a small node but still get reserved capacity, which keeps the Cluster Autoscaler from
  reacting to noise.
- **Memory limits are ~6× the request.** JavaScript heaps and the PostgreSQL page cache grow with
  load; a limit only twice the request turns a short spike into an OOMKill and a restart loop.
- **CPU limits are generous compared to requests.** CPU throttling shows up as latency, so the
  limit is set as a burst ceiling rather than as a quota.
- **Short-lived jobs get no CPU limit.** `pg_dump` and the generator either finish in seconds or
  fail on network timeouts; throttling them only makes the CronJob window longer.

Verify with:

```bash
kubectl top pods -n project
kubectl describe node | grep -A 8 "Allocated resources"
```
