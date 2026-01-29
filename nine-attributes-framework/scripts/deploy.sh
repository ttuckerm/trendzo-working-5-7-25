#!/bin/bash
set -euo pipefail

echo "Deploying Nine Attributes Framework..."

echo "Building Docker images..."
docker build -t nine-attrs/extraction:v1.0.0 services/extraction/
docker build -t nine-attrs/ranker:v1.0.0 services/ranker/
docker build -t nine-attrs/gateway:v1.0.0 services/gateway/

echo "Pushing images..."
docker push nine-attrs/extraction:v1.0.0
docker push nine-attrs/ranker:v1.0.0
docker push nine-attrs/gateway:v1.0.0

echo "Applying Kubernetes manifests..."
kubectl apply -f infrastructure/kubernetes/

echo "Waiting for deployments..."
kubectl wait --for=condition=available --timeout=300s deployment/nine-attrs-extraction
kubectl wait --for=condition=available --timeout=300s deployment/nine-attrs-ranker

echo "Smoke tests (optional)"
pytest tests/e2e -q || true

echo "Done."


