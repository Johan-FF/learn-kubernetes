Messagin systems
What you'll learn in this page
Creating a complex microservice architecture with NATS as the messaging system
Message queues(opens in a new tab) are a method for communication between services. They have a wide range of use cases and are helpful when you want to scale applications. A number of HTTP REST API services that want to communicate with each other require that the services know each other’s addresses. Meanwhile, when using message queues, messages are sent to and received from the message queue.

In this section, we will use a messaging system called NATS(opens in a new tab) to explore the benefits of messaging. Before we get started, we will review the basics of NATS.

In NATS applications communicate by sending and receiving messages. These messages are addressed and identified by subjects(opens in a new tab). The sender publishes the message with a subject. The receivers subscribe to subjects to get the published messages. In the default publish-subscribe(opens in a new tab) model of operation, all the subscribers of the subject receive the published message. It is also possible to use a queue(opens in a new tab) model, where each published message is given just to one subscriber.

NATS provides some different message delivery semantics or modes of operation. The basic functionality provided by Core NATS(opens in a new tab) is, at most, once messaging: if no subscribers are listening to the subject (no subject match) or are not active when the message is sent, the message is not received. By using the Jetstream(opens in a new tab) functionality, it is also possible to achieve at least once or exactly once messaging with persistence.

With these in mind, we can design our first application that uses messaging for communication.

We have a dataset of 100000 JSON objects that we need to do some heavy processing on and then save the processed data. Unfortunately, processing a single JSON object takes so long that processing all of the data would require hours of work. To solve this, I've split the application into smaller services that we can scale individually.

The application(opens in a new tab) is divided in 3 parts:

Fetcher, which fetches unprocessed data and passes it to NATS.
Mapper, which processes the data from NATS and after processing sends it back to NATS.
Saver, which receives the processed data from NATS and finally (could) save it.(opens in a new tab)
Add alt
As mentioned, the messaging in NATS is centered around subjects. In general, there is one subject per purpose. The app uses four subjects:

Add alt
Fetcher splits the data into chunks of 100 objects and keeps a record of which chunks have not been processed. The application is designed so that the Fetcher can not be scaled.

The Fetcher subscribes to the subject mapper_status and will wait for a Mapper to publish a message confirming that it's ready to process data. When the Fetcher receives this information, it publishes a chunk of data to the subject mapper_data and starts again from the beginning.

As mentioned, when a mapper is ready to process more data, it publishes the info of availability to the subject mapper_status. It also subscribes to the subject mapper_data. When the Mapper gets a message, it processes it and publishes the processed data to the subject saver_data and starts all over again. The subject mapper_data operates in queue mode, so each published message is received by only one Mapper.

The Saver subscribes to the subject saver_data. Once receiving a message, it saves it and publishes an acknowledgement message in the subject processed_data. The Fetcher subscribes to this subject and keeps track of what chunks of data have been saved. So even if any part of the application crashes, all of the data will eventually be processed and saved. Also, the subject saver_data is used in queue mode, so each chunk of processed data is taken care of by only one Saver.

For simplicity, saving to a database and fetching from external API are omitted from our app.

For a more detailed description of the app, see the pseudocode or the code.

Before deploying the app, we shall use the Helm chart to install NATS into our cluster:


helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update
helm upgrade --install my-nats nats/nats \
  --namespace nats \
  --create-namespace \
  --set promExporter.enabled=true
We can now run the app. From the logs we can see that data gets transmitted to the _saver_:


$ kubectl logs saver-dep-7548c99df-lhjsl
Received package 473. And data of length: 100
Received package 747. And data of length: 100
Received package 184. And data of length: 100
Received package 463. And data of length: 100
Received package 224. And data of length: 100
Received package 237. And data of length: 100
Received package 582. And data of length: 100
Received package 53. And data of length: 100
Received package 492. And data of length: 100
Received package 478. And data of length: 100
Received package 142. And data of length: 100
Besides NATS, we will also install the NATS Prometheus exporter, which exposes NATS server metrics in Prometheus format on the /metrics endpoint. Prometheus can then scrape these metrics, and we can use Grafana to visualize them in dashboards for real-time monitoring.

Let us now enable the monitoring. First we start Prometheus and Grafana similarly as in Chapter 3.

The next step is to tell Prometheus where to find the NATS pod metrics endpoint. This is done by applying the following value file nats-prom-values.yaml:


alertmanager:
  enabled: false

pushgateway:
  enabled: false

server:
  remoteWrite: []

# Static scrape config for NATS metrics
extraScrapeConfigs: |
  - job_name: nats
    metrics_path: /metrics
    static_configs:
      - targets:
          - my-nats-0.my-nats-headless.nats.svc.cluster.local:7777
The command is the following:


helm upgrade --install prom prometheus-community/prometheus \
  --namespace monitoring \
  --create-namespace \
  --values nats-prom-values.yaml
In more technical terms, this config adds a Prometheus scrape job named nats that targets my-nats-0.my-nats-headless.nats.svc.cluster.local:7777 and periodically scrapes its /metrics endpoint for metric ingestion.

As usual, we can use Grafana to visualize the data. Instead of writing the queries by ourselves, we use a ready-made configuration by applying grafana-values.yaml that sets up a dashboard with four panels. We apply the value file with the command:


helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --values grafana-values.yaml
Now we are ready to open the Grafana. As usual, we do a port-forward:


kubectl port-forward -n monitoring svc/grafana 3000:80
The dashboard looks like following:

Add alt
PromQL queries corresponding to the queries are the following:

NATS target up/down (up{job="nats"})
Connection count (sum(nats_varz_connections))
Message throughput in/out (rate(nats_varz_in_msgs[5m]), rate(nats_varz_out_msgs[5m]))
Byte throughput in/out (rate(nats_varz_in_bytes[5m]), rate(nats_varz_out_bytes[5m]))
See more from the documentation or from a blog post of the NATS creators.