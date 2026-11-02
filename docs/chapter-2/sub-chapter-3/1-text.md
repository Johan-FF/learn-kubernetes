Introduction to Networking
Now back to development! Restarting and following logs has been a treat. Next, we'll open an endpoint to the application and access it via HTTP.

Simple networking application
Let's develop our application so that it has an HTTP server responding with two hashes: a hash that is stored until the process is exited and a hash that is request specific. The response body can be something like "Application abc123. Request 94k9m2". Choose any port to listen to.

I've prepared one here(opens in a new tab). By default, it will listen on port 3000.


$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app2/manifests/deployment.yaml
  deployment.apps/hashresponse-dep created
Connecting from outside of the cluster
We can confirm that the hashresponse-dep is working with the port-forward command. Let's see the name of the pod first and then port forward there:


$ kubectl get po
  NAME                                READY   STATUS    RESTARTS   AGE
  hashgenerator-dep-5cbbf97d5-z2ct9   1/1     Running   0          20h
  hashresponse-dep-57bcc888d7-dj5vk   1/1     Running   0          19h

$ kubectl port-forward hashresponse-dep-57bcc888d7-dj5vk 3003:3000
  Forwarding from 127.0.0.1:3003 -> 3000
  Forwarding from [::1]:3003 -> 3000
Now we can view the response from http://localhost:3003(opens in a new tab) and confirm that it is working as expected.

As we see, the port-forward is a command used in Kubernetes to forward a local port to a pod. This allows you to easily access applications running inside your Kubernetes cluster from your local machine. Port-forwarding is not meant for production use, but it's very useful for debugging and development purposes.