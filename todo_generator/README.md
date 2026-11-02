# todo_generator

CronJob of the course project (exercise 2.9). Once an hour it fetches a random Wikipedia article
and creates a todo of the form `Read <article url>` through the todo backend API.

## Run locally

```bash
TODO_BACKEND_URL=http://127.0.0.1:3002 WIKIPEDIA_URL=https://en.wikipedia.org/api/rest_v1/page/random/summary npm start
```

## Deploy

```bash
docker build -t todo_generator:2.9 .
k3d image import todo_generator:2.9 -c devops --mode direct
kubectl apply -f manifests
```

## Verify without waiting for the schedule

```bash
kubectl create job -n project --from=cronjob/todo-generator manual-run
kubectl logs -n project job/manual-run
curl http://127.0.0.1:8081/todo
```
