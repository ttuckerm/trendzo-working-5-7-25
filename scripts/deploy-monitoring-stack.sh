#!/bin/bash

# MONITORING STACK DEPLOYMENT SCRIPT
# Production deployment of complete BMAD Advanced Monitoring & Alerting system
# Usage: ./scripts/deploy-monitoring-stack.sh [environment]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"production"}
NAMESPACE="monitoring"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 Deploying Complete Monitoring Stack${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo "================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_error "helm is not installed. Please install helm first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed. Please install docker first."
        exit 1
    fi
    
    # Check if we can connect to Kubernetes cluster
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Function to create namespace
create_namespace() {
    print_info "Creating monitoring namespace..."
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_warning "Namespace '$NAMESPACE' already exists"
    else
        kubectl create namespace "$NAMESPACE"
        kubectl label namespace "$NAMESPACE" name=monitoring purpose=observability
        print_status "Namespace '$NAMESPACE' created"
    fi
}

# Function to create secrets
create_secrets() {
    print_info "Creating secrets..."
    
    # Check if secrets exist, if not prompt for values
    if ! kubectl get secret grafana-secret -n "$NAMESPACE" &> /dev/null; then
        print_info "Creating Grafana secret..."
        read -p "Enter Grafana admin password (or press Enter for default): " GRAFANA_PASSWORD
        GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"admin123"}
        
        kubectl create secret generic grafana-secret \
            --from-literal=admin-password="$GRAFANA_PASSWORD" \
            --from-literal=secret-key="$(openssl rand -base64 32)" \
            -n "$NAMESPACE"
        print_status "Grafana secret created"
    fi
    
    if ! kubectl get secret smtp-secret -n "$NAMESPACE" &> /dev/null; then
        print_info "Creating SMTP secret..."
        read -p "Enter SMTP host (default: smtp.gmail.com:587): " SMTP_HOST
        read -p "Enter SMTP user: " SMTP_USER
        read -s -p "Enter SMTP password: " SMTP_PASSWORD
        echo
        
        SMTP_HOST=${SMTP_HOST:-"smtp.gmail.com:587"}
        
        kubectl create secret generic smtp-secret \
            --from-literal=host="$SMTP_HOST" \
            --from-literal=user="$SMTP_USER" \
            --from-literal=password="$SMTP_PASSWORD" \
            -n "$NAMESPACE"
        print_status "SMTP secret created"
    fi
    
    if ! kubectl get secret notification-secrets -n "$NAMESPACE" &> /dev/null; then
        print_info "Creating notification secrets..."
        read -p "Enter Slack webhook URL (optional): " SLACK_WEBHOOK
        read -p "Enter PagerDuty integration key (optional): " PAGERDUTY_KEY
        read -p "Enter Discord webhook URL (optional): " DISCORD_WEBHOOK
        
        kubectl create secret generic notification-secrets \
            --from-literal=slack-webhook="${SLACK_WEBHOOK:-""}" \
            --from-literal=pagerduty-key="${PAGERDUTY_KEY:-""}" \
            --from-literal=discord-webhook="${DISCORD_WEBHOOK:-""}" \
            -n "$NAMESPACE"
        print_status "Notification secrets created"
    fi
    
    if ! kubectl get secret database-secret -n "$NAMESPACE" &> /dev/null; then
        print_info "Creating database secret..."
        read -p "Enter database URL: " DATABASE_URL
        
        kubectl create secret generic database-secret \
            --from-literal=url="$DATABASE_URL" \
            -n "$NAMESPACE"
        print_status "Database secret created"
    fi
    
    if ! kubectl get secret supabase-secret -n "$NAMESPACE" &> /dev/null; then
        print_info "Creating Supabase secret..."
        read -p "Enter Supabase URL: " SUPABASE_URL
        read -p "Enter Supabase service key: " SUPABASE_KEY
        
        kubectl create secret generic supabase-secret \
            --from-literal=url="$SUPABASE_URL" \
            --from-literal=service-key="$SUPABASE_KEY" \
            -n "$NAMESPACE"
        print_status "Supabase secret created"
    fi
    
    # Create basic auth secret for monitoring endpoints
    if ! kubectl get secret monitoring-basic-auth -n "$NAMESPACE" &> /dev/null; then
        print_info "Creating basic auth for monitoring endpoints..."
        read -p "Enter monitoring username (default: admin): " MONITORING_USER
        read -s -p "Enter monitoring password: " MONITORING_PASSWORD
        echo
        
        MONITORING_USER=${MONITORING_USER:-"admin"}
        htpasswd -bc /tmp/auth "$MONITORING_USER" "$MONITORING_PASSWORD"
        
        kubectl create secret generic monitoring-basic-auth \
            --from-file=auth=/tmp/auth \
            -n "$NAMESPACE"
        rm /tmp/auth
        print_status "Basic auth secret created"
    fi
}

# Function to create config maps
create_configmaps() {
    print_info "Creating configuration maps..."
    
    # Prometheus configuration
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: $NAMESPACE
data:
  prometheus.yml: |
$(cat "$PROJECT_ROOT/docker/prometheus/prometheus.yml" | sed 's/^/    /')
EOF
    
    # Prometheus rules
    kubectl create configmap prometheus-rules \
        --from-file="$PROJECT_ROOT/docker/prometheus/rules/" \
        -n "$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Alertmanager configuration
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: $NAMESPACE
data:
  alertmanager.yml: |
$(cat "$PROJECT_ROOT/docker/alertmanager/alertmanager.yml" | sed 's/^/    /')
EOF
    
    # Grafana provisioning
    kubectl create configmap grafana-provisioning \
        --from-file="$PROJECT_ROOT/docker/grafana/provisioning/" \
        -n "$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Grafana dashboards
    kubectl create configmap grafana-dashboards \
        --from-file="$PROJECT_ROOT/docker/grafana/dashboards/" \
        -n "$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Loki configuration
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: loki-config
  namespace: $NAMESPACE
data:
  local-config.yaml: |
$(cat "$PROJECT_ROOT/docker/loki/loki.yml" | sed 's/^/    /')
EOF
    
    # Redis configuration
    kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: $NAMESPACE
data:
  redis.conf: |
    bind 0.0.0.0
    port 6379
    save 900 1
    save 300 10
    save 60 10000
    rdbcompression yes
    rdbchecksum yes
    maxmemory 256mb
    maxmemory-policy allkeys-lru
    appendonly yes
    appendfsync everysec
EOF
    
    print_status "Configuration maps created"
}

# Function to build and push custom monitoring dashboard
build_monitoring_dashboard() {
    print_info "Building custom monitoring dashboard..."
    
    # Build the Next.js monitoring dashboard
    cd "$PROJECT_ROOT"
    
    # Create Dockerfile for monitoring dashboard if it doesn't exist
    cat > docker/monitoring/Dockerfile <<EOF
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
EOF
    
    # Build and tag the image
    docker build -f docker/monitoring/Dockerfile -t trendzo/monitoring-dashboard:latest .
    
    # If using a registry, push the image
    if [[ -n "${DOCKER_REGISTRY:-}" ]]; then
        docker tag trendzo/monitoring-dashboard:latest "$DOCKER_REGISTRY/trendzo/monitoring-dashboard:latest"
        docker push "$DOCKER_REGISTRY/trendzo/monitoring-dashboard:latest"
        print_status "Monitoring dashboard image pushed to registry"
    else
        print_status "Monitoring dashboard image built locally"
    fi
}

# Function to deploy monitoring stack
deploy_monitoring_stack() {
    print_info "Deploying monitoring stack..."
    
    # Apply the complete monitoring stack
    kubectl apply -f "$PROJECT_ROOT/infrastructure/monitoring/complete-monitoring-stack.yaml"
    
    print_status "Monitoring stack deployed"
}

# Function to wait for deployments
wait_for_deployments() {
    print_info "Waiting for deployments to be ready..."
    
    # Wait for each deployment
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/alertmanager -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/monitoring-dashboard -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/redis-monitoring -n "$NAMESPACE"
    
    # Wait for StatefulSets
    kubectl wait --for=condition=ready --timeout=300s pod -l app=loki -n "$NAMESPACE"
    
    print_status "All deployments are ready"
}

# Function to create ingress certificates
setup_certificates() {
    print_info "Setting up SSL certificates..."
    
    # Check if cert-manager is installed
    if kubectl get crd certificates.cert-manager.io &> /dev/null; then
        print_info "cert-manager found, certificates will be automatically issued"
    else
        print_warning "cert-manager not found, please install cert-manager for automatic SSL certificates"
    fi
}

# Function to display access information
display_access_info() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "================================================="
    echo -e "${GREEN}🎉 MONITORING STACK DEPLOYED${NC}"
    echo "================================================="
    echo ""
    echo "Access your monitoring services:"
    echo ""
    echo -e "${BLUE}Custom Monitoring Dashboard:${NC}"
    echo "  https://monitoring.trendzo.com"
    echo ""
    echo -e "${BLUE}Grafana:${NC}"
    echo "  https://grafana.trendzo.com"
    echo "  Username: admin"
    echo "  Password: (the password you set during deployment)"
    echo ""
    echo -e "${BLUE}Prometheus:${NC}"
    echo "  https://prometheus.trendzo.com"
    echo ""
    echo -e "${BLUE}Alertmanager:${NC}"
    echo "  https://alertmanager.trendzo.com"
    echo ""
    echo "================================================="
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Configure your DNS to point to your ingress controller"
    echo "2. Review and customize alert rules in Prometheus"
    echo "3. Set up notification channels in Alertmanager"
    echo "4. Import custom dashboards in Grafana"
    echo "5. Test the monitoring stack with sample alerts"
    echo ""
    echo -e "${BLUE}For troubleshooting, check logs with:${NC}"
    echo "  kubectl logs -n $NAMESPACE -l app=prometheus"
    echo "  kubectl logs -n $NAMESPACE -l app=grafana"
    echo "  kubectl logs -n $NAMESPACE -l app=alertmanager"
    echo "  kubectl logs -n $NAMESPACE -l app=monitoring-dashboard"
    echo ""
}

# Function to run health checks
run_health_checks() {
    print_info "Running health checks..."
    
    # Check if all pods are running
    if kubectl get pods -n "$NAMESPACE" | grep -v Running | grep -v Completed | grep -v STATUS; then
        print_warning "Some pods are not in Running state"
        kubectl get pods -n "$NAMESPACE"
    else
        print_status "All pods are running"
    fi
    
    # Test endpoints
    print_info "Testing service endpoints..."
    
    # Port forward and test each service
    timeout 10 kubectl port-forward -n "$NAMESPACE" svc/prometheus 9090:9090 &
    PF_PID1=$!
    sleep 2
    if curl -f http://localhost:9090/-/healthy &> /dev/null; then
        print_status "Prometheus is healthy"
    else
        print_warning "Prometheus health check failed"
    fi
    kill $PF_PID1 &> /dev/null || true
    
    timeout 10 kubectl port-forward -n "$NAMESPACE" svc/grafana 3000:3000 &
    PF_PID2=$!
    sleep 2
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        print_status "Grafana is healthy"
    else
        print_warning "Grafana health check failed"
    fi
    kill $PF_PID2 &> /dev/null || true
    
    timeout 10 kubectl port-forward -n "$NAMESPACE" svc/alertmanager 9093:9093 &
    PF_PID3=$!
    sleep 2
    if curl -f http://localhost:9093/-/healthy &> /dev/null; then
        print_status "Alertmanager is healthy"
    else
        print_warning "Alertmanager health check failed"
    fi
    kill $PF_PID3 &> /dev/null || true
    
    print_status "Health checks completed"
}

# Main deployment function
main() {
    echo -e "${BLUE}Starting monitoring stack deployment...${NC}"
    
    check_prerequisites
    create_namespace
    create_secrets
    create_configmaps
    build_monitoring_dashboard
    deploy_monitoring_stack
    wait_for_deployments
    setup_certificates
    run_health_checks
    display_access_info
    
    echo -e "${GREEN}🎉 Monitoring stack deployment completed successfully!${NC}"
}

# Cleanup function for failed deployments
cleanup() {
    print_error "Deployment failed. Cleaning up..."
    kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    exit 1
}

# Set trap for cleanup on error
trap cleanup ERR

# Check if we should run in interactive mode
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi