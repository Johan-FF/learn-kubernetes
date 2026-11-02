Separate environment for each branch
A popular choice when using a deployment pipeline is having a separate environment for every branch, especially when using feature branching.

Let's implement our own version of this and extend the previously defined pipeline. The current state of the pipeline in the file main.yaml looks as follows:


name: Release application

on:
  push:

env:
  PROJECT_ID: ${{ secrets.GKE_PROJECT }}
  GKE_CLUSTER: dwk-cluster
  GKE_ZONE: europe-north1-b
  REGISTRY: europe-north1-docker.pkg.dev
  REPOSITORY: my-repository
  IMAGE: dwk-environments
  SERVICE: dwk-environments
  BRANCH: ${{ github.ref_name }}

jobs:
  build-publish-deploy:
    name: Build, Publish and Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - uses: google-github-actions/auth@v3
        with:
          credentials_json: '${{ secrets.GKE_SA_KEY }}'

      - name: 'Set up Cloud SDK'
        uses: google-github-actions/setup-gcloud@v3

      - name: 'Use gcloud CLI'
        run: gcloud info

      - name: 'Get GKE credentials'
        uses: 'google-github-actions/get-gke-credentials@v3'
        with:
          cluster_name: '${{ env.GKE_CLUSTER }}'
          project_id: '${{ env.PROJECT_ID }}'
          location: '${{ env.GKE_ZONE }}'

      - name: 'Set up Docker Buildx'
        run: gcloud auth configure-docker "$REGISTRY"
          
      - name : 'Form the image name'
        run: echo "IMAGE_TAG=$REGISTRY/$PROJECT_ID/$REPOSITORY/$IMAGE:$BRANCH-$GITHUB_SHA" >> $GITHUB_ENV

      - name: Build
        run: docker build --tag $IMAGE_TAG .

      - name: Publish
        run: docker push $IMAGE_TAG
      
      - name: Set up Kustomize
        uses: imranismail/setup-kustomize@v3

      - name: Deploy
        run: |-
          kustomize edit set image PROJECT/IMAGE=$IMAGE_TAG
          kustomize build . | kubectl apply -f -
          kubectl rollout status deployment $SERVICE
          kubectl get services -o wide
What we'll want to do is deploy each branch into a separate namespace so that each branch has its own separate environment.

The namespace can be changed with Kustomize:


kustomize edit set namespace ${GITHUB_REF#refs/heads/}
With this command, the namespace name will be equal to the branch name.

If the namespace is not defined, the command causes an error, so we need to create it:


kubectl create namespace ${GITHUB_REF#refs/heads/} || true
We also need to take the namespace to use with command:


kubectl config set-context --current --namespace=${GITHUB_REF#refs/heads/}
So the deploy step changes as follows:

Highlighted lines: 3 to 5
- name: Deploy
  run: |-
    kubectl create namespace ${GITHUB_REF#refs/heads/} || true
    kubectl config set-context --current --namespace=${GITHUB_REF#refs/heads/}
    kustomize edit set namespace ${GITHUB_REF#refs/heads/}
    kustomize edit set image PROJECT/IMAGE=$IMAGE_TAG
    kustomize build . | kubectl apply -f -
    kubectl rollout status deployment $SERVICE
    kubectl get services -o wide
To test this, edit the index.html and publish the changes to a new branch.

The next step would be to configure the domain names for each branch so that we'd have "www.example.com" as the production and e.g. "featx.example.com" as the featx branch. If you have any credits left after the course you can return here and implement it. Google Cloud DNS and this guide(opens in a new tab) can get you started.