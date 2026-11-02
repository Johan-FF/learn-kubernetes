2.5. Documentation and ConfigMaps
Tries
1

Points
0/1
Deadline: January 31, 2027 at 4:59 PM (UTC--5:00)
Instructions
Use the official Kubernetes documentation for this exercise. The following

https://kubernetes.io/docs/concepts/configuration/configmap/(opens in a new tab) and
https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/(opens in a new tab)
should contain everything you need.

Create a ConfigMap for the "Log output" application. The ConfigMap should define one file information.txt and one env variable MESSAGE.

The app should map the file as a volume, set the environment variable and print the content of those in addition to the usual output:


file content: this text is from file
env variable: MESSAGE=hello world
2026-05-18T12:15:17.705Z: 8523ecb1-c716-4cb6-a044-b9e83bb98e43.
Ping / Pongs: 3