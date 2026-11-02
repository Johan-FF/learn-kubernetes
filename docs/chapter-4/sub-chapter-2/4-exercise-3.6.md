3.6. The project, step 15
Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
Setup automatic deployment for the project as well.

If your pod uses a Persistent Volume Claim access mode ReadWriteOnce(opens in a new tab), you may need to consider the deployment strategy(opens in a new tab), since the default (RollingUpdate) may cause problems. Read more from the documentation(opens in a new tab). The other option is to use an access mode(opens in a new tab) that allows many pods to mount the volume.