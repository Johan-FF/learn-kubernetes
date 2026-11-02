Configuring applications
What you'll learn in this page
Pass configurations in to your pods
Options for storing secrets in version control
Searching for information in the Kubernetes documentation
Kubernetes has two resources for configuration management. Secrets(opens in a new tab) are for sensitive information that is given to containers at runtime. ConfigMaps are quite much like secrets, but they may contain any kind of configuration. Use cases for ConfigMaps vary: you may have a ConfigMap mapped to a file with some values that the server reads during runtime. Changing the ConfigMap will instantly change the behavior of the application. Both can also be used to introduce environment variables.

Secrets
Let's use pixabay(opens in a new tab) to display images on a simple web app. Authentication to the API is done with an API key. According to the API docs(opens in a new tab) we just need to log in to get ourselves a key.

The app manifests are here(opens in a new tab). Let us start up the app with a Service and an Ingress:


$ kubectl apply -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app4/manifests/deployment.yaml \
                -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app4/manifests/ingress.yaml \
                -f https://raw.githubusercontent.com/kubernetes-hy/material-example/master/app4/manifests/service.yaml
The application requires an API_KEY environment variable with a valid API key as the value.

The env is defined as a secret(opens in a new tab) in the deployment.yaml as follows:


# ...
containers:
  - name: imageagain
    envFrom:
      - secretRef:
          name: pixabay-apikey
This assumes that the secret pixabay-apikey defines the key as a variable called API_KEY. If the env name in the secret would be different, the longer form of definition could be used in the deployment.yaml:


# ...
containers:
  - name: imageagain
    env:
      - name: API_KEY # ENV name passed to container
        valueFrom:
          secretKeyRef:
            name: pixabay-apikey
            key: API_KEY # ENV name in the secret
The application won't run at first and we can see:


$ kubectl get pod
NAME                            READY   STATUS                       RESTARTS       AGE
imageapi-dep-6cdd4879f7-zwlbr   0/1     CreateContainerConfigError   0              13m
The exact reason can be seen with the command describe:


$ kubectl describe pod imageapi-dep-6cdd4879f7-zwlbr
Name:             imageapi-dep-6cdd4879f7-zwlbr
Status:           Pending
IP:               10.42.0.89

...

Events:
  Type     Reason     Age     From       Message
  ----     ------     ----    ----       -------
  Warning  Failed     21m     kubelet    Error: secret "pixabay-apikey" not found
  Normal   Pulled     3m15s   kubelet    Container image "jakousa/dwk-app4:b7fc18de2376da80ff0cfc72cf581a9f94d10e64" already present on machine
Let's use a secret to pass the API key environment variable to the application.

Secrets use base64(opens in a new tab) encoding to avoid having to deal with special characters. We would also like to use encryption to avoid printing our API_KEY for the world to see. At first, for the sake of testing, create and apply a new file secret.yaml with the following:


apiVersion: v1
kind: Secret
metadata:
  name: pixabay-apikey
data:
  API_KEY: aHR0cDovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PWRRdzR3OVdnWGNR
  # base64 encoded value should look something like this, note that this won't work
  # create your own apikey if you would like to test the app
The base64 encoded key can be created eg. with this(opens in a new tab) online tool, or in console with the command base64:


$ echo -n 'my-string' | base64
bXktc3RyaW5n
As the containers are already instructed to use the environment variable from the secret, it is picked up automatically. We can now confirm that the app is working at http://localhost:8081(opens in a new tab).

Encrypting secrets
Since anyone can reverse the base64 version, we can't save that to version control. Since we want to store our configuration in long-term storage, we'll need to encrypt the value.

There are multiple solutions for secret management depending on the platform. Cloud service providers may have their own solution, like Google Cloud Secret Manager(opens in a new tab) or AWS Secrets Manager(opens in a new tab). For a Kubernetes native solution, we could use SealedSecrets(opens in a new tab). In fact, the SealedSecrets were used in a previous version of this course.

We will now use SOPS(opens in a new tab) to encrypt the secret.yaml file. The tool has some additional flexibility, so I hope you get some use out of it, regardless of the environment you will be working in the future. For example, you could use it with Docker Compose files. Please take a moment to read through the Readme, or at least the Motivation(opens in a new tab). We will use age(opens in a new tab) for encryption because it's recommended over PGP in the Readme. So install both of the tools, SOPS and age.

Let's create a key-pair first:


$ age-keygen -o key.txt
  Public key: age17mgq9ygh23q0cr00mjn0dfn8msak0apdy0ymjv5k50qzy75zmfkqzjdam4
This key.txt file now contains our public and secret keys. The secret key still can not be added to version control, it's our personal key. Let's encrypt the values in the file secret.yaml. You can also omit the —encrypted-regex if you want.


$ sops --encrypt \
       --age age17mgq9ygh23q0cr00mjn0dfn8msak0apdy0ymjv5k50qzy75zmfkqzjdam4 \
       --encrypted-regex '^(data)$' \
       secret.yaml > secret.enc.yaml
The secret.enc.yaml looks like this:


apiVersion: v1
kind: Secret
metadata:
  name: pixabay-apikey
data:
  API_KEY: ENC[AES256_GCM,data:geKXBLn4kZ9A2KHnFk4RCeRRnUZn0DjtyxPSAVCtHzoh8r6YsCUX3KiYmeuaYixHv3DRKHXTyjg=,iv:Lk290gWZnUGr8ygLGoKLaEJ3pzGBySyFJFG/AjwfkJI=,tag:BOSX7xJ/E07mXz9ZFLCT2Q==,type:str]
sops:
  kms: []
  gcp_kms: []
  azure_kv: []
  hc_vault: []
  age:
    - recipient: age17mgq9ygh23q0cr00mjn0dfn8msak0apdy0ymjv5k50qzy75zmfkqzjdam4
      enc: |
        -----BEGIN AGE ENCRYPTED FILE-----
        YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IFgyNTUxOSBDczBhbGNxUkc4R0U0SWZI
        OEVYTEdzNUlVMEY3WnR6aVJ6OEpGeCtJQ1hVCjVSbDBRUnhLQjZYblQ0UHlneDIv
        UmswM2xKUWxRMHZZQjVJU21UbDNEb3MKLS0tIGhOMy9lQWx4Q0FUdVhoVlZQMjZz
        dDEreFAvV3Nqc3lIRWh3RGRUczBzdXcKh7S4q8qp5SrDXLQHZTpYlG43vLfBlqcZ
        BypI8yEuu18rCjl3HJ+9jbB0mrzp60ld6yojUnaggzEaVaCPSH/BMA==
        -----END AGE ENCRYPTED FILE-----
  lastmodified: "2026-05-18T17:08:22Z"
  mac: ENC[AES256_GCM,data:qhOMGFCDBXWhuildW81qTni1bnaBBsYo7UHlv2PfQf8yVrdXDtg7GylX9KslGvK22/9xxa2dtlDG7cIrYFpYQPAh/WpOzzn9R26nuTwvZ6RscgFzHCR7yIqJexZJJszC5yd3w5RArKR4XpciTeG53ygb+ng6qKdsQsvb9nQeBxk=,iv:PZLF3Y+OhtLo+/M0C0hqINM/p5K94tb5ZGc/OG8loJI=,tag:ziFOjWuAW/7kSA5tyAbgNg==,type:str]
  pgp: []
  encrypted_regex: ^(data)$
  version: 3.13.1
We can safely store the file to the version control, since only the holders of the secret key pair of age17mgq9ygh23q0cr00mjn0dfn8msak0apdy0ymjv5k50qzy75zmfkqzjdam4 will be able to decode it. Remember to use your own keys!

If we want to encrypt a file for the whole team, we will need to add a list of public keys while encrypting. Any of the private key owners can then decrypt the file. In fact, the best method is that (almost) no-one has the private key! Public key can be used to encrypt individual files, and the private key can be stored separately and used to decrypt the file just in time.

You can decrypt the encrypted file by exporting the key file in SOPS_AGE_KEY_FILE environment variable and running sops with —decrypt flag.


$ export SOPS_AGE_KEY_FILE=$(pwd)/key.txt

$ sops --decrypt secret.enc.yaml > secret.yaml
You can also apply a secret yaml via piping directly, this helps avoid creating a plain secret.yaml file:


$ sops --decrypt secret.enc.yaml | kubectl apply -f -
ConfigMaps
ConfigMaps(opens in a new tab) are similar but the data doesn't have to be encoded and is not encrypted. Let's say you have a videogame server that takes a configuration file serverconfig.txt which looks like this:


maxplayers=12
difficulty=2
We could use a ConfigMap to contain the file:


apiVersion: v1
kind: ConfigMap
metadata:
  name: example-configmap
data:
  serverconfig.txt: |
    maxplayers=12
    difficulty=2
Now the ConfigMap can be added to the container as a volume. By changing a value, like "maxplayers" in this case, and applying the ConfigMap the changes would be reflected in that volume.

Exercise: