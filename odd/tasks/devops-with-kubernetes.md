# DevOps with Kubernetes — full course execution plan

Objective: complete all 55 exercises of the University of Helsinki "DevOps with Kubernetes"
course (chapters 2-6, 54 exercise files + exercise 0.0) inside this repository, producing for
each exercise a git tag/release named after the exercise and a README link pointing to the
relevant application directory at that release.

Branch: `main` (submission repository)
Test runner: none global; per-app verification is `kubectl`/HTTP plus app-level tests where the
exercise requires them (5.1 controller, 4.6 broadcaster).
Artifact store: this file (local tracking document).

## Constraints from the course brief

- Repo layout: one directory per application; each application has its own `README.md`.
- One GitHub release per exercise, tag == exercise number (`1.1`, `1.2`, ...).
- Root `README.md` links every exercise to the release + directory of that exercise.
- Repository must be accessible to GitHub user `mattiluukkainen`.
- Chapter 3 (exercises 3.1-3.12) requires Google Kubernetes Engine; it is mandatory there.
- Deadline: 31 January 2027. Grade 5 requires ~50+ exercises.

## Specs

- S1. Every exercise directory contains runnable source plus Kubernetes manifests, and a
  `README.md` that explains how it is started.
- S2. Every exercise has a git tag named exactly as the exercise id, pushed as a GitHub release.
- S3. Root `README.md` links each exercise id to its release URL and app directory.
- S4. Chapter 4 work runs on GKE; chapters 2, 3 and 5-6 run on local k3d clusters (5.6 requires
  a cluster created with traefik disabled).
- S5. Each exercise is verified before tagging: manifests apply cleanly, pods reach Ready, and the
  exercise-specific observable behavior is observed (logs, HTTP response, PromQL result, screenshot).
- S6. Comparison/write-up exercises (3.9, 5.5, 5.8) deliver a documented answer in their app
  `README.md`, no cluster state required.
- S7. Image build strategy: local `docker build` + `k3d image import` for local exercises;
  registry images (Docker Hub / ghcr) for GKE exercises, since GKE cannot pull local images.
- S8. Configuration is separated from application code: env vars, ConfigMaps and Secrets as the
  course teaches, never hardcoded values that the exercise asks to externalize.

## Tasks

### Phase 0 — Toolchain and cluster baseline

- T0.1 Install/pin toolchain: docker (present), kubectl (present), k3d 5.9, helm 3.22, gh,
  gcloud. Route: inline. Status: done.
- T0.2 Create `k3d` cluster `devops` with `-a 2`, port 8081->80 loadbalancer and
  8082->30080 agent, verify `kubectl get nodes`. Route: inline.
- T0.3 Git init, `.gitignore`, root `README.md` skeleton with the exercise index table.
- T0.4 Record app directories and exercise-to-directory mapping in the README.

### Phase 1 — Chapter 2 (local k3d fundamentals)

- T1.1 1.1 log_output: Node app, random string at startup, timestamped log every 5 s, Deployment, `kubectl logs`.
- T1.2 1.2 todo_app: HTTP server printing `Server started in port NNNN`, PORT env.
- T1.3 1.3 log_output declarative: move to `manifests/`, `kubectl apply`.
- T1.4 1.4 todo_app deployment YAML.
- T1.5 1.5 todo_app serves HTML at `/`, verified through `kubectl port-forward`.
- T1.6 1.6 todo_app NodePort Service.
- T1.7 1.7 log_output status endpoint + Ingress.
- T1.8 1.8 todo_app replaces NodePort with Ingress.
- T1.9 1.9 ping_pong counter app + Ingress path `/pingpong`.
- T1.10 1.10 log_output writer/reader split into two containers sharing an `emptyDir`.
- T1.11 1.11 shared PV/PVC between log_output and ping_pong counter file.
- T1.12 1.12 todo_app caches Lorem Picsum image hourly on a PVC.
- T1.13 1.13 todo_app todo input, Send button, hardcoded list.

### Phase 2 — Chapter 3 (services, config, state, logging)

- T2.1 2.1 log_output <-> ping_pong over HTTP with a ClusterIP Service and DNS.
- T2.2 2.2 todo_backend with GET/POST `/todos`, wired to the frontend.
- T2.3 2.3 move exercise apps into the `exercises` namespace.
- T2.4 2.4 create the `project` namespace and move project resources.
- T2.5 2.5 ConfigMap with a file and a MESSAGE env var, both printed by log_output.
- T2.6 2.6 project configuration fully externalized via env/ConfigMap.
- T2.7 2.7 Postgres StatefulSet (1 replica) storing the ping_pong counter.
- T2.8 2.8 Postgres StatefulSet for todos; backend connects via Secret/ConfigMap.
- T2.9 2.9 CronJob adding an hourly "Read <random Wikipedia URL>" todo.
- T2.10 2.10 request logging + 140-char limit, inspected in Grafana (Loki).

### Phase 3 — Chapter 4 (GKE, mandatory)

Blocked on: GCP project + billing + `gcloud auth login` (B2), and image registry push (S7).

- T3.1 3.1 ping_pong on GKE behind a LoadBalancer Service.
- T3.2 3.2 log_output + ping_pong on GKE behind Ingress with `/pingpong`.
- T3.3 3.3 Gateway API replacing Ingress.
- T3.4 3.4 HTTPRoute URLRewrite serving ping_pong on `/`.
- T3.5 3.5 project manifests converted to Kustomize and deployed to GKE.
- T3.6 3.6 GitHub Actions deployment pipeline for the project.
- T3.7 3.7 per-branch preview environments with branch namespaces.
- T3.8 3.8 workflow deleting the namespace when the branch is deleted.
- T3.9 3.9 DBaaS vs DIY comparison write-up (Cloud SQL vs self-hosted Postgres).
- T3.10 3.10 CronJob `pg_dump` backup to Google Cloud Storage.
- T3.11 3.11 CPU/memory requests and limits.
- T3.12 3.12 GKE monitoring enabled + log screenshot for todo creation.

### Phase 4 — Chapter 5 (probes, observability, GitOps)

- T4.1 4.1 readiness probes gated on Postgres and ping_pong connectivity.
- T4.2 4.2 project health endpoint + probes, "break app" button restarts the pod.
- T4.3 4.3 Prometheus via Helm, PromQL query over StatefulSet pods.
- T4.4 4.4 Argo Rollouts AnalysisTemplate reverting a rollout on CPU overuse.
- T4.5 4.5 project `Done` field + `PUT /todos/<id>`.
- T4.6 4.6 broadcaster service consuming NATS todo events.
- T4.7 4.7 log_output deployment managed by ArgoCD.
- T4.8 4.8 project main branch deployment managed by ArgoCD.
- T4.9 4.9 staging/production namespaces, tags -> production, main -> staging.
- T4.10 4.10 split application code and configuration repositories (requires a second repo, B3).

### Phase 5 — Chapter 6 (extensions and write-ups)

- T5.1 5.1 DummySite CRD + controller fetching a URL into HTML (needs Go or Python controller + tests).
- T5.2 5.2 Istio ambient + Kiali + sample app.
- T5.3 5.3 greeter service, 75/25 traffic split with Istio HTTPRoute.
- T5.4 5.4 wikipedia: init container fetch + sidecar refresh, nginx serving.
- T5.5 5.5 Rancher vs OpenShift platform comparison write-up.
- T5.6 5.6 Knative on k3d (traefik disabled), autoscaling + traffic split.
- T5.7 5.7 ping_pong moved to Knative with host/path rewrite.
- T5.8 5.8 CNCF landscape: circle used projects, state where each was used.
- T5.9 5.9 submit the main repository link, final release `5.9`.

## Human dependencies (cannot be automated)

- B1. GitHub: `gh auth login`, create the submission repository, dist/create releases, grant
  access to `mattiluukkainen`.
- B2. Google Cloud: create/select a project, enable billing, `gcloud auth login`,
  `gcloud container clusters create`, push images to a registry. Chapter 4 is mandatory on GKE.
- B3. A second repository for exercise 4.10 (config repo separated from app code).
- B4. Local resources for 5.2 (Istio + Kiali) and 5.6 (Knative): those installs are heavy; the
  cluster may need to be recreated with traefik disabled.

## Log

L1. (original request, verbatim) "en este proyecto dentro de la carpeta @docs\ está todo lo que
necesito hacer, lo entiendes?" and "haz un plan para poder resolver todo, absolutamente todo, si
necesitas instalar un cli para lograrlo hazlo, pero no te detengas".

L2. Environment scan: docker 27.0.3 (linux engine) present; kubectl present; git/node/npm/python
present; k3d, gh, gcloud, helm missing. Installed k3d 5.9.0 (winget), gh 2.103.3 (winget),
helm 3.22.1 (direct download to `C:\Users\Vortex\bin`, Helm 3 pinned for chart compatibility),
gcloud (winget, background install).

L3. Description of the course structure captured from `docs/`: chapter-1 is the course brief,
chapters 2-6 interleave theory (`*text*.md`) and exercise statements (`*exercise*.md`), 54
exercise files spanning 1.1 -> 5.9.
