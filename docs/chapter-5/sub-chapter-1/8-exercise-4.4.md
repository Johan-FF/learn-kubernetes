4.4. Your canary
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Create an AnalysisTemplate for the Ping-pong app that will follow the CPU usage of all containers in the namespace.

If the CPU usage rate sum for the namespace increases above a set value (you may choose a good hardcoded value) within 5 minutes, revert the update.

Make sure that the application doesn't get updated, if the value is set too low.