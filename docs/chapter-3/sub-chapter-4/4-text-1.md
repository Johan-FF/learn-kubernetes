Jobs and CronJobs
Job(opens in a new tab) resource is used to run workloads that are not continuous services, but are supposed to run from start to end. The status of a job is saved so that it can be monitored after the execution has ended. Jobs can be configured so that they run multiple instances of the same task concurrently, sequentially and until a set number of successful completions have been achieved.

An example use case for jobs would be creating backups from a database. Our Job will use the environment variable URL as the url from which the dump is created and pass it along to a storage server. Our database will be Postgres and the tool for creating a backup is pg_dump(opens in a new tab). Now we just need to do the coding. A simple bash script should be enough.


#!/usr/bin/env bash
set -e

if [ $URL ]
then
  pg_dump -v $URL > /usr/src/app/backup.sql

  echo "Not sending the dump actually anywhere"
  # curl -F ‘data=@/usr/src/app/backup.sql’ https://somewhere
fi
The above script has already been packed to an image jakousa/simple-backup-example(opens in a new tab).

Since we don't have any Postgres available to us yet, let's deploy one first:


apiVersion: v1
kind: Service
metadata:
  name: postgres-svc
  labels:
    app: postgres
spec:
  ports:
  - port: 5432
    name: web
  clusterIP: None
  selector:
    app: postgres
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-ss
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:18.0
          ports:
            - name: postgres
              containerPort: 5432
          env:
          - name: POSTGRES_PASSWORD
            value: "example"
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: local-path
        resources:
          requests:
            storage: 100Mi
Apply the above and check it's running:


$ kubectl get po
  NAME                                READY   STATUS    RESTARTS   AGE
  postgres-ss-0                       1/1     Running   0          65s
Now we can apply the following job that uses the image:


apiVersion: batch/v1
kind: Job
metadata:
  name: backup
spec:
  template:
    spec:
      containers:
      - name: backup
        image: jakousa/simple-backup-example
        env:
          - name: URL
            value: "postgres://postgres:example@postgres-svc:5432/postgres"
      restartPolicy: Never # This time we'll run it only once
Pods have a few available configurations. For example, we can force it to retry for a number of times by defining backoffLimit.


$ kubectl get jobs
  NAME     COMPLETIONS   DURATION   AGE
  backup   1/1           7s         35s

$ kubectl logs backup-wj9r5
  ...
  pg_dump: saving encoding = UTF8
  pg_dump: saving standard_conforming_strings = on
  pg_dump: saving search_path =
  pg_dump: implied data-only restore
  Not sending the dump actually anywhere
CronJobs(opens in a new tab) are similar to Jobs but they run on schedule. You may have already used cron(opens in a new tab) schedule tasks on your server, CronJobs are essentially the same for the containers.