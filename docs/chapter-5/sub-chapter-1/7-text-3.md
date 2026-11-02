The AnalysisTemplate will, in our case, use Prometheus to query the state of the deployment. The query result is then compared to a preset value. In this simplified case, if the number of overall restarts over the last 2 minutes is higher than two, it will fail the analysis. initialDelay will ensure that the test is not run until the required data is gathered. The template in the file analysistemplate.yaml looks as follows:


apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: restart-rate
spec:
  metrics:
  - name: restart-rate
    initialDelay: 2m
    successCondition: result < 2
    provider:
      prometheus:
        address: http://kube-prometheus-stack-1602-prometheus.prometheus.svc.cluster.local:9090 # DNS name for my Prometheus, find yours with kubectl describe svc ...
        query: |
          scalar(
            sum(kube_pod_container_status_restarts_total{namespace="default", container="flaky-update"}) -
            sum(kube_pod_container_status_restarts_total{namespace="default", container="flaky-update"} offset 2m)
          )
With the new Rollout and AnalysisTemplate, we can safely try to deploy any version. Deploy for v2 is prevented with the Probes we set up. Deploy for v3 will automatically roll back when it notices that it has random crashes. The v4 will also eventually fail, but the short 2 minutes to test may still let a version get deployed.

The Argo Rollouts kubectl plugin(opens in a new tab) allows you to visualize the Rollout and its related resources. To watch the Rollout as it deploys, we can run it in watch mode:


kubectl argo rollouts get rollout flaky-update-dep --watch
Add alt
Besides the pods, we see here also AnalysisRun(opens in a new tab) that is the instance of the test being run. You might also want to try Argo Rollouts dashboard(opens in a new tab), which gives even fancier visualization of the state of your rollouts.

In general, the AnalysisTemplate is not dependent on Prometheus and could use a different source, such as a JSON endpoint, instead.