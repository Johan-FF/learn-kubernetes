2.2. The project, step 8
Tries
1

Points
0/1
Deadline: January 31, 2027 at 4:59 PM (UTC--5:00)
Instructions
Let us get back to our Project. In the last exercise of the previous Chapter, we added a random pic and a form for creating todos to the app. The next step is to create a new service that takes care of saving the todo items.

This new service, let us call it todo-backend, should have a GET /todos endpoint for fetching the list of todos and a POST /todos endpoint for creating a new todo. The todos can be saved in memory, we'll add a database later.

If your todo-app is a Single page application, your setup after this exercise might look like this:

Add alt
The role of the service that we made in previous exercises (Todo-app in the figure) is to serve the HTML and possibly JavaScript to the browser. Also, the logic for serving random pictures and caching those remains in that service. The new service then takes care of the todo items.

If your todo-app is a traditional web app that relies on server-side rendering, the setup can be a bit different:

Add alt
So the role of todo-app is pretty much the same, it serves the html with rended todo items that it gets from the new todo-backend service.

After this exercise, you should be able to create new todos using the form, and the created todos should be rendered in the browser.

NOTE f you deleted the cluster and its PVC since completing the previous chapter, you may find that the PVC remains stuck in a Pending state, preventing the pod from starting.

This happens because once a local persistent volume is released, it cannot be rebound automatically. To resolve this, you must delete and recreate the persistent volume so that the PVC can bind to it successfully.

