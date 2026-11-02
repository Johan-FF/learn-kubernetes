4.2. The project, step 21
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Create the required probes and endpoint for The Project to ensure that it's working and connected to a database.

Add a button to your app that can be used to "break" the app:

Add alt
Pressing the button causes the normal operation of the app to stop:

Add alt
You may implement the feature, e.g., with a boolean variable that controls what the health check should respond with:


let isHealthy = true

// ...

app.get("/healthz", (req, res) => {
  if (!isHealthy) {
    return res.status(500).json({ status: "unhealthy" })
  }

  return res.status(200).json({ status: "ok" })
})
Ensure that once you "break" the app, a new pod will be started up soon and the app becomes healthy again.