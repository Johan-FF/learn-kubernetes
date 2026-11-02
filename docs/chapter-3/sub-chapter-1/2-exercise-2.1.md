2.1. Connecting pods
Tries
1

Points
0/1
Deadline: January 31, 2027 at 4:59 PM (UTC--5:00)
Instructions
Connect the Log output application and the Ping pong application with HTTP. So, instead of sharing data via files, use an HTTP GET endpoint in the Ping pong app to respond with the number of pongs for the Log output app. Remove the volume between the two applications for the time being.

Connection between the pods look like the following:

Add alt
The response of the HTTP GET to Log output will stay the same:


2026-05-18T12:15:17.705Z: 8523ecb1-c716-4cb6-a044-b9e83bb98e43.
Ping / Pongs: 3