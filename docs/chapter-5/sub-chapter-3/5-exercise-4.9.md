4.9. The project, step 25
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Enhance the Project setup as follows

Create two separate environments, production and staging that are in their own namespaces
Each commit to the main branch should result in deployment to the staging environment
Each tagged commit results in deployment to the production environment
In staging the broadcaster just logs all the messages, it does not forward those to any external service
In staging database is not backed up
You may assume that secrets are readily applied outside of the ArgoCD
