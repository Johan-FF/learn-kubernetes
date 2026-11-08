// The DummySite controller: for every DummySite object it creates the Deployment and the Service
// that turn the requested URL into an HTML page served from inside the cluster.
package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
)

var gvr = schema.GroupVersionResource{
	Group:    "dwk.example.com",
	Version:  "v1",
	Resource: "dummysites",
}

type controller struct {
	kube kubernetes.Interface
}

func main() {
	cfg, err := rest.InClusterConfig()
	if err != nil {
		log.Fatalf("in-cluster config: %v", err)
	}

	kube, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		log.Fatalf("kubernetes client: %v", err)
	}

	dyn, err := dynamic.NewForConfig(cfg)
	if err != nil {
		log.Fatalf("dynamic client: %v", err)
	}

	c := &controller{kube: kube}

	factory := dynamicinformer.NewFilteredDynamicSharedInformerFactory(dyn, 10*time.Minute, metav1.NamespaceAll, nil)
	informer := factory.ForResource(gvr).Informer()

	if _, err := informer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			if u, ok := obj.(*unstructured.Unstructured); ok {
				if err := c.reconcile(u); err != nil {
					log.Printf("reconcile %s/%s: %v", u.GetNamespace(), u.GetName(), err)
				}
			}
		},
	}); err != nil {
		log.Fatalf("event handler: %v", err)
	}

	stop := make(chan struct{})
	factory.Start(stop)
	factory.WaitForCacheSync(stop)

	log.Println("DummySite controller started")
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	close(stop)
}

func (c *controller) reconcile(site *unstructured.Unstructured) error {
	name := site.GetName()
	namespace := site.GetNamespace()

	url, found, err := unstructured.NestedString(site.Object, "spec", "website_url")
	if err != nil || !found || url == "" {
		return fmt.Errorf("spec.website_url is missing")
	}

	log.Printf("creating resources for %s/%s serving %s", namespace, name, url)

	owner := []metav1.OwnerReference{{
		APIVersion: "dwk.example.com/v1",
		Kind:       "DummySite",
		Name:       name,
		UID:        site.GetUID(),
	}}

	ctx := context.Background()
	resourceName := "dummysite-" + name

	if _, err := c.kube.AppsV1().Deployments(namespace).Create(ctx, deploymentFor(resourceName, url, owner), metav1.CreateOptions{}); err != nil {
		if !isAlreadyExists(err) {
			return fmt.Errorf("deployment: %w", err)
		}
		log.Printf("deployment %s/%s already exists", namespace, resourceName)
	}

	if _, err := c.kube.CoreV1().Services(namespace).Create(ctx, serviceFor(resourceName, owner), metav1.CreateOptions{}); err != nil {
		if !isAlreadyExists(err) {
			return fmt.Errorf("service: %w", err)
		}
		log.Printf("service %s/%s already exists", namespace, resourceName)
	}

	return nil
}

func isAlreadyExists(err error) bool {
	return apierrors.IsAlreadyExists(err)
}

func deploymentFor(name, url string, owner []metav1.OwnerReference) *appsv1.Deployment {
	labels := map[string]string{"app": name}
	replicas := int32(1)

	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:            name,
			Labels:          labels,
			OwnerReferences: owner,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{MatchLabels: labels},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{Labels: labels},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{{
						Name:         "html",
						VolumeSource: corev1.VolumeSource{EmptyDir: &corev1.EmptyDirVolumeSource{}},
					}},
					InitContainers: []corev1.Container{{
						Name:    "fetch",
						Image:   "curlimages/curl:8.11.0",
						Command: []string{"sh", "-c", fmt.Sprintf("curl -sSfL %q -o /usr/share/nginx/html/index.html", url)},
						VolumeMounts: []corev1.VolumeMount{{
							Name:      "html",
							MountPath: "/usr/share/nginx/html",
						}},
					}},
					Containers: []corev1.Container{{
						Name:  "nginx",
						Image: "nginx:1.27-alpine",
						Ports: []corev1.ContainerPort{{ContainerPort: 80}},
						VolumeMounts: []corev1.VolumeMount{{
							Name:      "html",
							MountPath: "/usr/share/nginx/html",
						}},
						ReadinessProbe: &corev1.Probe{
							ProbeHandler: corev1.ProbeHandler{
								HTTPGet: &corev1.HTTPGetAction{Path: "/", Port: intstr.FromInt(80)},
							},
							InitialDelaySeconds: 3,
							PeriodSeconds:       5,
						},
					}},
				},
			},
		},
	}
}

func serviceFor(name string, owner []metav1.OwnerReference) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:            name,
			Labels:          map[string]string{"app": name},
			OwnerReferences: owner,
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{"app": name},
			Ports: []corev1.ServicePort{{
				Protocol:   corev1.ProtocolTCP,
				Port:       2345,
				TargetPort: intstr.FromInt(80),
			}},
		},
	}
}
