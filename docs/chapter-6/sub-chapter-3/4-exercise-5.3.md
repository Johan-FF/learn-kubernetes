5.3. Log app, the Service Mesh Edition
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Deploy the Log to the service mesh. Extend the app with a new service greeter that responds with an HTTP GET request with a greeting (such as hello). The log output app should use the greeter service and display the greeting among the rest of the output:

Add alt
Once you get the basic setup working, deploy two versions of the greeter, and split the traffic so that the other (v1) gets 75% of the traffic and the other (v1) gets the rest. The setup looks in Kiali as follows:

Add alt
Tips:

Our setup is very simillar to the one used in the Istio example app, see here and look how the manifests look like
As you see, the traffic splitting is done with a HTTPRoute object where you need to set a service (the greeter-svc) as a parentRefs
You need most likely three separate services for the greeter, the greeter-svc to which you attach the HTTPRoute that points to greeter-svc-1 and greeter-svc-2
Use Kiali to ensure that the traffic is split correctly within the greeters.