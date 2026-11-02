5.7. Deploy to serverless
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Make the Ping-pong service of the Log Output app use serverless.

Reading this(opens in a new tab) might be helpful.

TIPS:

Use the fully qualified Kubernetes service DNS name when calling services.
So instead of, e.g., http://pingpong, you must use http://pingpong.exercises.svc.cluster.local. This avoids host-routing issues in the Knative setup and ensures requests resolve correctly inside the cluster.
You could set the hostname in the url rewrite role to make the pigpong endpoint accessibe also from the browser:
Highlighted lines: 9
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /pingpong
      filters:
        - type: URLRewrite
          urlRewrite:
            hostname: pingpong.exercises.192.168.144.3.sslip.io
            path:
              type: ReplacePrefixMatch
              replacePrefixMatch: /