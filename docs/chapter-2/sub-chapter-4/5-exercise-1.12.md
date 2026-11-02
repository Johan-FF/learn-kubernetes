1.12. The project, step 6
Tries
1

Points
0/1
Deadline: January 31, 2027 at 4:59 PM (UTC--5:00)
Instructions
Since the project looks a bit boring right now, let's add a picture!

The goal is to add an hourly image to the project.

Get a random picture from Lorem Picsum like https://picsum.photos/1200 and display it in the project. Find a way to store the image so it stays the same for 10 minutes.

After 10 minutes have passed, you might give the old pic still one more time, and for the next request, there should be a new picture
Make sure to cache the image into a persistent volume so that the API isn't needed for new images every time we access the application or the container crashes.

The best way to test what happens when your container shuts down is likely by shutting down the container, so you can add logic for that as well, for testing purposes.

After this exercise, your app can look for example like the following:

Add alt
