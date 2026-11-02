
Note that applying a new deployment won't update the application unless the image tag is updated. You will not need to delete the deployment if you always come up with a new tag.

Your basic workflow may look something like this:


$ docker build -t <image>:<new_tag>

$ docker push <image>:<new_tag>
Then edit deployment.yaml so that the tag is updated to the <new_tag> and run the following command


$ kubectl apply -f manifests/deployment.yaml
This process might seem a bit tedious or even error-prone to you, and you are quite right! We'll learn a more elegant way of doing application updates in Chapter 4.