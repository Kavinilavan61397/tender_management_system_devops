#!/bin/bash
# install-monitoring.sh
# Run this script on your local machine after the cluster is up and your kubeconfig is configured!

# Add Helm Repositories
echo "Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Create a namespace for monitoring
kubectl create namespace monitoring

# Install Prometheus & Grafana (kube-prometheus-stack)
# We disable some heavy components (like AlertManager) to save RAM on the free tier K3s node
echo "Installing Prometheus and Grafana..."
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set alertmanager.enabled=false \
  --set prometheus.prometheusSpec.resources.requests.memory="200Mi" \
  --set grafana.resources.requests.memory="100Mi"

# Install Loki (for logging, much lighter than ELK)
echo "Installing Loki for centralized logging..."
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set fluent-bit.enabled=false \
  --set promtail.enabled=true \
  --set loki.persistence.enabled=false # Keep it lightweight for the tutorial

echo "--------------------------------------------------------"
echo "Monitoring Stack Installed! It may take a few minutes to spin up."
echo "To access Grafana, run this command to port-forward:"
echo "  kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring"
echo ""
echo "Then open your browser to http://localhost:3000"
echo "Default Username: admin"
echo "Default Password: prom-operator"
echo "--------------------------------------------------------"
