5.1. DIY CRD & Controller
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
This exercise doesn't rely on previous exercises. You may again choose whichever technologies you want for the implementation.

We need a DummySite resource that can be used to create an HTML page from any URL.

Create a "DummySite" resource that has a string property called "website_url".
Create a controller that receives a created "DummySite" object from the API
Have the controller create all of the resources that are required for the functionality.
Refer to https://kubernetes.io/docs/reference/kubernetes-api/(opens in a new tab) and https://kubernetes.io/docs/reference/using-api/api-concepts/(opens in a new tab) for more information on Kubernetes API, and https://kubernetes.io/docs/reference/using-api/client-libraries/(opens in a new tab) for information about client libraries.

You may also take inspiration from the material example apps: JavaScript(opens in a new tab), Go(opens in a new tab). Note that the JavaScript app does not quite utilize the features of Kubernetes Client(opens in a new tab), but it calls the REST API directly. It also uses a rather old version of the Kubernetes JavaScript Client, so you can not use its code much in your app. The documentation of the Kubernetes JavaScript Client is not the best possible, but you will find quite useful stuff from the examples.

Test that creating a DummySite resource with website_url "https://example.com/(opens in a new tab)" creates a copy of the website. With a more complex website your "copy" does not need to be a complete one. Eg. in https://en.wikipedia.org/wiki/Kubernetes(opens in a new tab) the CSS styles can be broken:(opens in a new tab)

Add alt
The controller doesn't have to work perfectly in all circumstances. The following workflow should succeed:

apply role, account and binding.
apply deployment.
apply DummySite