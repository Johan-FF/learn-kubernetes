3.10. The project, step 18
Tries
1

Points
0/1
Deadline: 2027-01-31 16:59:59 UTC-05:00
Instructions
In part 3 we did a Job that made a backup of our Database using the command pg_dump. Unfortunately, the backup was not saved anywhere. Create now a CronJob that makes a backup of your todo database (once per 24 hours) and saves it to Google Object Storage(opens in a new tab).

In this exercise, you can create the secret for the cloud access from the command line, thus, there is no need to create it in the GitHub action.

When the cron job is working, you can e.g. download the backups using the Google Cloud Console:

Add alt
The hardest part of this exercise is perhaps giving your cron job permission to upload the backup to the storage. There are two possible approaches. One is to use Authenticate to Google Cloud APIs from GKE workloads. That is the recommended and safest approach, but it can be tricky to configure correctly. A simpler way is to create another service account with the needed privileges and create a key for the account:


gcloud iam service-accounts create "my-storage-sa" --display-name="Pod Storage SA"

gcloud projects add-iam-policy-binding my-dwk-gke \
  --role="roles/storage.objectCreator" \
  --member="serviceAccount:my-storage-sa@my-dwk-gke.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding my-dwk-gke \
  --role="roles/storage.objectViewer" \
  --member="serviceAccount:my-storage-sa@my-dwk-gke.iam.gserviceaccount.com"

gcloud iam service-accounts keys create key.json \
  --iam-account=my-storage-sa@my-project.iam.gserviceaccount.com
You can then generate a secret from this key file either manually or with the command


kubectl create secret generic storage-sa-key --from-file=key.json=key.json
Now the key is easy to mount to a pod or cronjob as a file.

Remember not to store the secret or in GitHub!