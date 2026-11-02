2.7. Stateful applications
Tries
1

Points
0/1
Deadline: January 31, 2027 at 4:59 PM (UTC--5:00)
Instructions
Run a Postgres database as a stateful set (with one replica) and save the Ping-pong application counter into the database.

Hint: it might be a good idea to ensure that the database is operational and available for connections before you try connecting it from the Ping-pong app. For that purpose, you might just start a stand-alone pod that runs a Postgres image:


  kubectl run -it --rm --restart=Never --image postgres psql-for-debugging sh
  $ psql postgres://yourpostgresurlhere
  psql (16.2 (Debian 16.2-1.pgdg120+2))
  Type "help" for help.
  postgres=# \d
  Did not find any relations.