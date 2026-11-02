GitHub Actions
GitHub Actions(opens in a new tab) will be the CI/CD tool of choice for this course. Google also offers Cloud Build(opens in a new tab), and a step-by-step guide to deploying to GKE(opens in a new tab) with it. You can return here to implement deployment with Cloud Build if you have credits left over after the course!

Our GitHub Actions workflow will push Docker images to Google Artifact Registry. Go now to the Artifact Registry in the Google Console, and create a Docker repository:

Add alt
Now we are ready to define the workflow in the file .github/workflows/main.yaml. We'll want the workflow to do 3 things:

build the image
publish the image to a artifact registry
deploy the new image to our cluster
The initial config will look something like this:


name: Release application

on:
  push:

permissions:
  contents: read
  id-token: write

env:
  PROJECT_ID: ${{ secrets.GKE_PROJECT }}
  GKE_CLUSTER: dwk-cluster
  GKE_ZONE: europe-north1-b
  REGISTRY: europe-north1-docker.pkg.dev
  REPOSITORY: my-repository
  IMAGE: dwk-environments
  SERVICE: dwk-environments
  BRANCH: ${{ github.ref_name }}
We set the workflow to run whenever changes are pushed to the repository and set the environment variables accordingly. We'll need them later on. Note that in the variables we have REPOSITORY, which is the name of the Docker repository that we just created. REGISTRY is the identifier of the Artifact Registry, see here for the list of Registry locations.

Next is adding the jobs. For simplicity, we'll add everything into a single job that'll build, publish and deploy.

Highlighted lines: 6
# ...
jobs:
  build-publish-deploy:
    name: Build, Publish and Deploy
    runs-on: ubuntu-latest
    environment: GKE_PROJECT

    steps:
      - name: Checkout
        uses: actions/checkout@v6
This sets the environment for the job and triggers the checkout action(opens in a new tab) as the first step. Note that the environment name must match the one that is defined in the workflow file, see the above.

Next we'll use some additional actions, mainly from google-github-actions(opens in a new tab) that are designed to help on deployments to Google Cloud. We'll start with authentication(opens in a new tab), followed by setup(opens in a new tab):


# ...
  - uses: google-github-actions/auth@v3
    with:
      workload_identity_provider: "${{ secrets.WORKLOAD_IDENTITY_PROVIDER }}"
      service_account: "${{ secrets.SERVICE_ACCOUNT }}"

  - name: 'Set up Cloud SDK'
    uses: google-github-actions/setup-gcloud@v3

  - name: 'Use gcloud CLI'
    run: gcloud info
The secrets used in authentication should be included as environment secrets in the project GitHub.

Add alt
Read here(opens in a new tab) more on GitHub secrets. The secret GKE_PROJECT is the Google Cloud project ID, which you find in the Google Cloud console.

How about SERVICE_ACCOUNT and WORKLOAD_IDENTITY_PROVIDER?

The first of these is the service account. Let us first create it with the required permissions:


# Create a service account
gcloud iam service-accounts create "github-actions-sa" \
  --display-name="GitHub Actions SA"

gcloud projects add-iam-policy-binding PROJECT_ID \
  --role="roles/artifactregistry.writer" \
  --member="serviceAccount:github-actions-sa@PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding my-dwk-gke \
  --role="roles/container.admin" \
  --member="serviceAccount:github-actions-sa@PROJECT_ID.iam.gserviceaccount.com
The PROJECT_ID in the command must naturally be set correctly. Next, we will create a workload identity pool and OIDC provider:


gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='YOUR_ORG/YOUR_REPO'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
As one might guess YOUR_ORG/YOUR_REPO needs to be defined with own values.

Final step is to allow GitHub repo to impersonate the as the service account:


gcloud iam service-accounts add-iam-policy-binding \
  github-actions-sa@PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_ORG/YOUR_REPO"
There are several values here that need to be set correctly. The PROJECT_NUMBER can be seen by running the command gcloud projects list. We are now ready to set the action secrets:

Value of the SERVICE_ACCOUNT is github-actions-sa@PROJECT_ID.iam.gserviceaccount.com

Value of the WORKLOAD_IDENTITY_PROVIDER is a bit more complex:


projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
What did we actually do?
We wanted GitHub Actions to push Docker images to Google Cloud without storing any secrets.

To do that, we built a chain of trust between GitHub and Google Cloud in 5 steps.

First, we created a Service Account — the Google Cloud identity our pipeline acts as, since Google Cloud permissions can't be granted directly to a GitHub identity.

We then granted that service account the artifactregistry.writer role, so it has permission to push images. It was also given the container.clusterViewer role.

Next, we created a Workload Identity Pool — a container in Google Cloud that holds trusted external identity sources.

Then we registered GitHub as a trusted OIDC Provider inside that pool, essentially telling Google Cloud: "when you see a token that came from GitHub, trust it, and here is how to read the information it contains", like which repository triggered the workflow.

Finally we added a binding that allows our specific GitHub repo to impersonate the service account. This is what locks it down so only our repo can use it, not any other workflow on GitHub.

With this in place, when the pipeline runs, GitHub issues a short-lived signed token, Google Cloud verifies it, and exchanges it for a service account token. No secrets stored anywhere.

See more from the documentation:

Authenticate to Google Cloud from GitHub Actions
Federation with GitHub Actions specifically
Workload Identity Federation overview
Next, use gcloud commands to configure Docker registry:


# ...
  - run: gcloud --quiet auth configure-docker $REGISTRY
This will enable us to push images to Google Artifact Registry, which we'll use instead of Docker Hub. We could use Docker Hub if we wanted to do so, but GCR is an excellent option now that we have access to it. GCR is a lot more performant and has a low network latency. Cutting down on the time we spend moving images around will ensure our deployments are quick. Read more about it here https://cloud.google.com/container-registry/(opens in a new tab). Note that the registry is not free(opens in a new tab) and you'll probably want to delete the images from there during and after this course.

One more step is needed until we are ready to go, we still need to use action get-gke-credentials(opens in a new tab) to our Google Kubernetes cluster to get credentials :


# ...
  - name: 'Get GKE credentials'
    uses: 'google-github-actions/get-gke-credentials@v3'
    with:
      cluster_name: '${{ env.GKE_CLUSTER }}'
      project_id: '${{ env.PROJECT_ID }}'
      location: '${{ env.GKE_ZONE }}'
We are finally ready to build the image. The image tag will be a lengthy one. Since we will refer it several times, let us define a variable IMAGE_TAG where we set the name. The variable definition uses a trick, it echoes the new variable to to GITHUB_ENV:


# ...
  - name : 'Form the image name'
    run: echo "IMAGE_TAG=$REGISTRY/$PROJECT_ID/$REPOSITORY/$IMAGE:$BRANCH-$GITHUB_SHA" >> $GITHUB_ENV
The generated image tag name looks something like this


europe-north-docker.pkg.dev/dwk-gke-12312/myregistry/dwk-environments:main-c00adaefda1f7169
So, it starts with the registry location and contains the project ID and the name of our Docker repository. dwk-environments is the service where the image is deployed and the tag is based on the branch name (main) and the GitHub commit sha that is taken from env $GITHUB_SHA, that is automatically provided by the workflow.

Building and pushing the image is easy, we just use the image tag name that is saved to variable:


# ...
  - name: Build
    run: docker build --tag $IMAGE_TAG .

  - name: Publish
    run: docker push $IMAGE_TAG
Last step is the deployment. We'll setup Kustomize first:


# ...
- name: Set up Kustomize
  uses: imranismail/setup-kustomize@v3
Now we can use Kustomize to set the image we want the pipeline to publish. Here I pipe the output of kustomize build . to kubectl apply, if you are unsure what is happening you can output the kustomize build . and check what was built in the middle of the pipeline!

Finally we'll preview the rollout(opens in a new tab) and confirm that the release was a success. Rollout will wait until the deployment has rolled out. Here we use the same name of the image, dwk-environments, as the deployment name so we can use the $IMAGE environment variable.


# ...
- name: Deploy
  run: |-
    kustomize edit set image PROJECT/IMAGE=$IMAGE_TAG
    kustomize build . | kubectl apply -f -
    kubectl rollout status deployment $SERVICE
    kubectl get services -o wide