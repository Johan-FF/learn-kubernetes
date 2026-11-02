4.6. The project, step 23
Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Create a new separate service for sending status messages of the todos to some chat service. Let's call the new service "broadcaster".

Requirements:

The backend should send a message to NATS on saving or updating todos
The broadcaster should subscribe to NATS messages
The broadcaster should send the message forward to an external service in a format they support
As the external service you can choose either:

Discord (you can use the course Full Stack Discord, see here(opens in a new tab) for the details)
Telegram
Slack
or if you don't want to use them, use "Generic" where a URL is set as an Environment variable and the payload is e.g.


{
  "user": "bot",
  "message": "A todo was created"
}
The broadcaster should be able to be scaled without sending the message multiple times. Test that it can run with 6 replicas without issues. The messages only have to be sent to the external service if all of the services are working correctly. So a randomly missing message is not an issue but a duplicate is.

Example of a working broadcaster: