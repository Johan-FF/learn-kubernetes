3.4. Rewritten routing
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
After the previous exercise, your ping-pong app now most likely needs to respond to the URL /pingpong to work in the cluster setup.

It would be nice if we were not forced to reflect the cluster-level URL structures in the applications, and instead, the app itself could provide the behavior in the root path /. Thanks to the flexibility of the Gateway API, this can be easily done by route rewriting.

Make this change to your ping-pong app and to the HTTP route!