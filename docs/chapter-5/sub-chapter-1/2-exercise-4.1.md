4.1. Readines probe
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Create a ReadinessProbe for the Ping-pong application. It should be ready when it has a connection to the database.

And another ReadinessProbe for Log output application. It should be ready when it can receive data from the Ping-pong application.

Test that it works by applying everything but the database statefulset. The output of kubectl get po should look like this before the database is available:


NAME                             READY   STATUS    RESTARTS   AGE
logoutput-dep-7f49547cf4-ttj4f   1/2     Running   0          21s
pingpong-dep-9b698d6fb-jdgq9     0/1     Running   0          21s
Adding the database should automatically move the READY states to 2/2 and 1/1 for Log output and Ping-pong respectively.