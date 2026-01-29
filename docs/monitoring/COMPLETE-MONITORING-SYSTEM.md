# Complete BMAD Monitoring & Alerting System

## Overview

This document describes the complete production-ready monitoring, alerting, and analytics system implemented for the Trendzo viral prediction platform. The system follows the BMAD (Build, Monitor, Alert, Dashboard) methodology and provides comprehensive observability across all system components.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BMAD MONITORING ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   COLLECTION    │    │   PROCESSING    │    │   PRESENTATION  │  │
│  │                 │    │                 │    │                 │  │
│  │ • Real-time     │───▶│ • Prometheus    │───▶│ • Grafana       │  │
│  │   Monitor       │    │ • VictoriaMetrics│    │ • Custom UI     │  │
│  │ • Node Exporter │    │ • Analytics     │    │ • Reports       │  │
│  │ • cAdvisor      │    │   Engine        │    │                 │  │
│  │ • App Metrics   │    │ • AI Insights   │    │                 │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │    ALERTING     │    │     STORAGE     │    │   INTELLIGENCE  │  │
│  │                 │    │                 │    │                 │  │
│  │ • AlertManager  │    │ • Time Series   │    │ • Forecasting   │  │
│  │ • Multi-channel │    │ • Logs (Loki)   │    │ • Anomaly Detect│  │
│  │ • Escalation    │    │ • Cache (Redis) │    │ • Business Intel│  │
│  │ • PagerDuty     │    │ • Long-term     │    │ • Insights      │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Real-time Performance Monitoring
**File**: `src/lib/monitoring/real-time-monitor.ts`

**Features**:
- Response time tracking (P95, P99)
- Throughput monitoring (RPS)
- Error rate analysis
- System resource monitoring (CPU, Memory, Disk, Network)
- Automatic metric collection
- Prometheus metrics export

**Key Metrics**:
```typescript
// Response Times
trendzo_response_time_seconds
trendzo_response_time_p95_seconds
trendzo_response_time_p99_seconds

// Throughput
trendzo_requests_total
trendzo_requests_per_second

// Errors
trendzo_errors_total
trendzo_error_rate_percent

// System Resources
trendzo_cpu_usage_percent
trendzo_memory_usage_percent
trendzo_disk_usage_percent
```

### 2. Business Metrics Dashboard
**File**: `src/lib/monitoring/business-metrics-dashboard.ts`

**Features**:
- User engagement tracking
- Viral prediction success metrics
- API usage analytics
- Growth metrics
- Revenue tracking
- Customer lifecycle analysis

**Key Metrics**:
```typescript
// User Engagement
trendzo_active_users_total
trendzo_session_duration_seconds
trendzo_user_retention_rate

// Predictions
trendzo_prediction_accuracy_percent
trendzo_prediction_latency_ms
trendzo_predictions_total

// Business
trendzo_monthly_recurring_revenue
trendzo_customer_acquisition_cost
trendzo_churn_rate_percent
```

### 3. Multi-channel Alert System
**File**: `src/lib/monitoring/alert-system.ts`

**Features**:
- Multi-channel notifications (Email, Slack, Discord, SMS, PagerDuty)
- Intelligent thresholds with adaptive learning
- Escalation policies
- Alert suppression and grouping
- Rate limiting

**Supported Channels**:
- 📧 Email (SMTP)
- 💬 Slack
- 🎮 Discord
- 📱 SMS (Twilio)
- 🔗 Webhooks
- 👥 Microsoft Teams
- 📟 PagerDuty

### 4. Analytics & Reporting
**File**: `src/lib/monitoring/analytics-reporting.ts`

**Features**:
- Historical trend analysis
- Forecasting and prediction
- Anomaly detection
- Automated report generation
- Business intelligence
- Custom analytics queries

**Report Types**:
- Performance reports
- Business reports
- Security reports
- Executive summaries
- Custom reports

## Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- Helm 3.0+
- kubectl
- Docker
- cert-manager (for SSL)

### Quick Start

1. **Clone and prepare**:
```bash
git clone <repository>
cd <project>
```

2. **Deploy monitoring stack**:
```bash
# For Kubernetes deployment
./scripts/deploy-monitoring-stack.sh production

# For Docker Compose (development)
docker-compose -f docker/monitoring-stack.yml up -d
```

3. **Configure DNS**:
```bash
# Point these domains to your ingress controller
monitoring.trendzo.com     -> Kubernetes Ingress IP
grafana.trendzo.com        -> Kubernetes Ingress IP
prometheus.trendzo.com     -> Kubernetes Ingress IP
alertmanager.trendzo.com   -> Kubernetes Ingress IP
```

### Manual Deployment

1. **Create namespace**:
```bash
kubectl create namespace monitoring
```

2. **Create secrets**:
```bash
# Grafana credentials
kubectl create secret generic grafana-secret \
  --from-literal=admin-password="your-password" \
  --from-literal=secret-key="$(openssl rand -base64 32)" \
  -n monitoring

# SMTP configuration
kubectl create secret generic smtp-secret \
  --from-literal=host="smtp.gmail.com:587" \
  --from-literal=user="your-email@gmail.com" \
  --from-literal=password="your-app-password" \
  -n monitoring

# Notification channels
kubectl create secret generic notification-secrets \
  --from-literal=slack-webhook="https://hooks.slack.com/..." \
  --from-literal=pagerduty-key="your-pagerduty-key" \
  --from-literal=discord-webhook="https://discord.com/api/webhooks/..." \
  -n monitoring
```

3. **Deploy stack**:
```bash
kubectl apply -f infrastructure/monitoring/complete-monitoring-stack.yaml
```

## Configuration

### Alert Rules

Edit `docker/prometheus/rules/alert-rules.yml`:

```yaml
groups:
- name: trendzo-alerts
  rules:
  # High response time
  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }}s"
  
  # High error rate
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value | humanizePercentage }}"
  
  # Prediction accuracy drop
  - alert: PredictionAccuracyDrop
    expr: avg_over_time(trendzo_prediction_accuracy_percent[1h]) < 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Prediction accuracy below threshold"
      description: "Accuracy is {{ $value }}%"
```

### Notification Channels

Edit `docker/alertmanager/alertmanager.yml`:

```yaml
route:
  receiver: 'default-notifications'
  group_by: ['alertname', 'severity']
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
    group_wait: 10s
    repeat_interval: 30m

receivers:
- name: 'critical-alerts'
  email_configs:
  - to: 'alerts@trendzo.com'
    subject: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
  
  slack_configs:
  - api_url: 'YOUR_SLACK_WEBHOOK'
    channel: '#alerts-critical'
    title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
    color: 'danger'
  
  pagerduty_configs:
  - routing_key: 'YOUR_PAGERDUTY_KEY'
    description: 'Critical Alert: {{ .GroupLabels.alertname }}'
```

## API Usage

### Real-time Monitoring

```typescript
import { realTimeMonitor } from '@/lib/monitoring/real-time-monitor';

// Start monitoring
realTimeMonitor.startMonitoring();

// Record response time
realTimeMonitor.recordResponseTime({
  endpoint: '/api/predictions',
  method: 'POST',
  responseTime: 150,
  statusCode: 200,
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
  timestamp: new Date()
});

// Get metrics
const throughput = realTimeMonitor.getThroughputMetrics();
const systemResources = await realTimeMonitor.getSystemResourceMetrics();
```

### Business Metrics

```typescript
import { businessMetricsDashboard } from '@/lib/monitoring/business-metrics-dashboard';

// Get business dashboard
const dashboard = await businessMetricsDashboard.getBusinessDashboard('day');

// Get specific metrics
const userEngagement = await businessMetricsDashboard.getUserEngagementMetrics('week');
const viralMetrics = await businessMetricsDashboard.getViralPredictionMetrics('month');
```

### Alerting

```typescript
import { alertSystem } from '@/lib/monitoring/alert-system';

// Create alert rule
const ruleId = await alertSystem.createAlertRule({
  name: 'High CPU Usage',
  description: 'CPU usage above 80%',
  metric: MetricType.CPU_USAGE,
  condition: 'greater_than',
  threshold: 80,
  severity: AlertSeverity.WARNING,
  channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
  cooldownPeriod: 15, // minutes
  tags: ['infrastructure'],
  enabled: true,
  escalationRules: []
});

// Trigger manual alert
await alertSystem.triggerManualAlert(
  'System Maintenance',
  'Scheduled maintenance window starting',
  AlertSeverity.INFO,
  [AlertChannel.EMAIL]
);
```

### Analytics

```typescript
import { analyticsReporting } from '@/lib/monitoring/analytics-reporting';

// Generate business intelligence
const intelligence = await analyticsReporting.generateBusinessIntelligence('month');

// Execute custom query
const results = await analyticsReporting.executeAnalyticsQuery({
  metrics: ['response_time', 'error_rate'],
  filters: { environment: 'production' },
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  granularity: 'day'
});

// Generate forecast
const forecast = await analyticsReporting.generateForecast('revenue', 30);
```

## Dashboards

### Custom Monitoring Dashboard
- **URL**: `https://monitoring.trendzo.com`
- **Features**: Real-time metrics, business intelligence, alert management
- **Authentication**: Basic auth or OAuth

### Grafana Dashboards
- **URL**: `https://grafana.trendzo.com`
- **Pre-configured dashboards**:
  - System Overview
  - Application Performance
  - Business Metrics
  - Error Analysis
  - Infrastructure Health

### Prometheus
- **URL**: `https://prometheus.trendzo.com`
- **Features**: Metric exploration, alert rule testing, query builder

## Troubleshooting

### Common Issues

1. **Pods not starting**:
```bash
# Check pod status
kubectl get pods -n monitoring

# Check pod logs
kubectl logs -n monitoring deployment/prometheus
kubectl describe pod -n monitoring <pod-name>
```

2. **Metrics not appearing**:
```bash
# Check Prometheus targets
curl http://prometheus:9090/api/v1/targets

# Check service discovery
kubectl get endpoints -n monitoring
```

3. **Alerts not firing**:
```bash
# Check alert rules
curl http://prometheus:9090/api/v1/rules

# Check Alertmanager status
curl http://alertmanager:9093/api/v1/status
```

4. **High memory usage**:
```bash
# Check Prometheus retention
kubectl exec -n monitoring deployment/prometheus -- \
  promtool query instant 'prometheus_tsdb_retention_limit_bytes'

# Adjust retention in deployment
kubectl patch deployment prometheus -n monitoring -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"prometheus","args":["--storage.tsdb.retention.time=30d"]}]}}}}'
```

### Performance Tuning

1. **Prometheus**:
```yaml
# Increase resources
resources:
  requests:
    memory: "4Gi"
    cpu: "2000m"
  limits:
    memory: "8Gi"
    cpu: "4000m"

# Adjust retention
args:
  - --storage.tsdb.retention.time=90d
  - --storage.tsdb.retention.size=50GB
```

2. **Grafana**:
```yaml
# Enable caching
env:
- name: GF_RENDERING_SERVER_URL
  value: "http://grafana-image-renderer:8081/render"
- name: GF_RENDERING_CALLBACK_URL
  value: "http://grafana:3000/"
```

## Security

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: monitoring-network-policy
  namespace: monitoring
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: default
```

### RBAC
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: monitoring
  name: monitoring-reader
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
```

### Secret Management
- Use Kubernetes secrets for sensitive data
- Rotate credentials regularly
- Use external secret management (e.g., Vault) in production

## Monitoring Metrics

### Application Metrics
- Response times (P50, P95, P99)
- Request rates
- Error rates
- Business KPIs

### Infrastructure Metrics
- CPU, Memory, Disk usage
- Network I/O
- Container metrics
- Kubernetes resource usage

### Business Metrics
- User engagement
- Revenue metrics
- Prediction accuracy
- Customer satisfaction

## Best Practices

1. **Metric Naming**: Follow Prometheus naming conventions
2. **Alert Fatigue**: Use proper thresholds and grouping
3. **Dashboard Design**: Focus on actionable insights
4. **Data Retention**: Balance storage costs with data needs
5. **Security**: Implement proper authentication and authorization
6. **Monitoring the Monitors**: Monitor the monitoring system itself

## Support

For issues and questions:
- Check logs: `kubectl logs -n monitoring <pod-name>`
- Review configuration: `kubectl get configmap -n monitoring`
- Test connectivity: `kubectl exec -it <pod> -- wget -qO- <url>`
- Prometheus status: `/api/v1/status/config`
- Grafana health: `/api/health`

## Future Enhancements

- [ ] Machine learning-based anomaly detection
- [ ] Cost optimization recommendations
- [ ] Advanced forecasting models
- [ ] Integration with external APM tools
- [ ] Mobile app for monitoring
- [ ] Voice alerts via phone calls
- [ ] Automated remediation actions