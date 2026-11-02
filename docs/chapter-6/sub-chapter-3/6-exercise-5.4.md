5.4. Wikipedia with init and sidecar
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Write an app that serves Wikipedia pages. The app should contain

the main container based on nginx image, that just serves whatever content it has in the public www location
init container that curls page https://en.wikipedia.org/wiki/Kubernetes(opens in a new tab) and saves the page content to the public www directory for the main container
a sidecar container that waits for a random time between 5 and 15 minutes, curls for a random Wikipedia page in URL https://en.wikipedia.org/wiki/Special:Random(opens in a new tab) and saves the page content to the public www directory for the main container
Hint: you might need to refresh your memory by reading this from Chapter 2 of the course.