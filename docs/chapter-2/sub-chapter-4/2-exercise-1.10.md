1.10. Even more services
Tries
1

Points
0/1
Deadline: January 31, 2027 at 4:59 PM (UTC--5:00)
Instructions
Split the "Log output" application into two different containers within a single pod:

One generates a random string on startup and writes a line with the random string and timestamp every 5 seconds into a file.
The other reads that file and provides the content in the HTTP GET endpoint for the user to see
You may find this(opens in a new tab) helpful now since there are more than one container running inside a pod.