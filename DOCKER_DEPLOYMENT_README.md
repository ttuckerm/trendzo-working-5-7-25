# 🐳 TRENDZO DOCKER DEPLOYMENT STACK

## Complete Production-Ready Containerized Infrastructure

This deployment stack provides a **production-ready, auto-scaling, monitored** containerized environment for the Trendzo viral prediction platform.

---

## 🚀 **QUICK START**

### **1. Prerequisites**
```bash
# Install Docker and Docker Compose
# Windows: Download Docker Desktop
# macOS: Download Docker Desktop  
# Linux: Follow Docker installation guide

# Verify installation
docker --version
docker-compose --version
```

### **2. Environment Setup**
```bash
# Copy environment template
cp docker/environment/env.template .env.production

# Edit with your actual API keys and secrets
nano .env.production
```

### **3. Deploy**
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run full production deployment
./deploy.sh
```

### **4. Access Services**
- **🌐 Application**: https://localhost
- **📊 Grafana Dashboard**: http://localhost:3001
- **📈 Prometheus Metrics**: http://localhost:9090
- **🔍 Jaeger Tracing**: http://localhost:16686

---

## 📋 **DEPLOYMENT STACK OVERVIEW**

### **🏗️ Core Infrastructure**
- **✅ Multi-stage Dockerfile** - Optimized production builds
- **✅ Docker Compose** - Development and production environments
- **✅ Nginx Reverse Proxy** - Load balancing, SSL termination, rate limiting
- **✅ Auto-scaling Configuration** - Kubernetes HPA and VPA
- **✅ Comprehensive Monitoring** - Prometheus, Grafana, Loki, Jaeger

### **🔐 Security Features**
- **✅ SSL/TLS Encryption** - Automatic certificate generation
- **✅ Security Headers** - HSTS, CSP, XSS protection
- **✅ Rate Limiting** - API protection against abuse
- **✅ Container Security** - Non-root users, read-only filesystems
- **✅ Secret Management** - Kubernetes secrets, environment validation

### **⚡ Performance Optimizations**
- **✅ Load Balancing** - Multiple application instances
- **✅ Caching Strategy** - Redis cache, static asset caching
- **✅ Resource Limits** - CPU/memory constraints
- **✅ Health Checks** - Automatic failure detection and recovery

---

## 📁 **DIRECTORY STRUCTURE**

```
📦 Trendzo Docker Stack
├── 🐳 Dockerfile                    # Production container definition
├── 🐳 docker-compose.yml           # Development environment
├── 🐳 docker-compose.prod.yml      # Production environment
├── 🚀 deploy.sh                    # Automated deployment script
├── 📖 DOCKER_DEPLOYMENT_README.md  # This documentation
│
├── 📁 docker/
│   ├── 🌐 nginx/                   # Reverse proxy configuration
│   │   ├── nginx.conf              # Main Nginx config
│   │   └── conf.d/trendzo.conf     # Application-specific config
│   │
│   ├── 🔐 ssl/                     # SSL certificates
│   │   ├── generate-certs.sh       # Certificate generation script
│   │   └── generate-certs.ps1      # Windows certificate script
│   │
│   ├── 🔧 environment/             # Environment management
│   │   ├── env.template            # Environment variables template
│   │   └── validate-env.js         # Environment validation script
│   │
│   ├── 📊 prometheus/              # Metrics collection
│   │   └── prometheus.yml          # Prometheus configuration
│   │
│   ├── 📈 grafana/                 # Monitoring dashboards
│   │   ├── provisioning/           # Auto-provisioned datasources
│   │   └── dashboards/             # Pre-built dashboards
│   │
│   ├── 📋 loki/                    # Log aggregation
│   │   └── loki.yml                # Loki configuration
│   │
│   ├── 📨 promtail/                # Log shipping
│   │   └── promtail.yml            # Log collection config
│   │
│   └── 🛡️ security/               # Security configurations
│       └── docker-security.conf    # Security hardening settings
│
└── ☸️ k8s/                        # Kubernetes deployment
    ├── namespace.yaml              # Kubernetes namespace
    ├── deployment.yaml             # Application deployment
    ├── service.yaml                # Load balancer service
    ├── hpa.yaml                    # Horizontal pod autoscaler
    ├── ingress.yaml                # External traffic routing
    ├── configmap.yaml              # Configuration management
    └── secrets-template.yaml       # Secrets template
```

---

## 🔧 **DEPLOYMENT MODES**

### **🖥️ Local Development**
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **🏭 Production Deployment**
```bash
# Full production deployment
./deploy.sh

# Production with custom environment
./deploy.sh staging

# Build images only
./deploy.sh --build-only

# Check deployment status
./deploy.sh --status

# View service logs
./deploy.sh --logs

# Stop all services
./deploy.sh --stop
```

### **☸️ Kubernetes Deployment**
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (edit secrets-template.yaml first)
kubectl apply -f k8s/secrets-template.yaml

# Deploy application stack
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n trendzo-production

# View application logs
kubectl logs -f deployment/trendzo-app -n trendzo-production

# Scale application
kubectl scale deployment trendzo-app --replicas=5 -n trendzo-production
```

---

## ⚙️ **CONFIGURATION GUIDE**

### **🔐 Environment Variables**

**Required Variables:**
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Authentication
NEXTAUTH_SECRET=your_secure_32_character_secret
NEXTAUTH_URL=https://yourdomain.com

# AI Services (at least one required)
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key

# Data Scraping (optional)
APIFY_API_TOKEN=apify_api_your_token
```

**Validation:**
```bash
# Validate environment configuration
node docker/environment/validate-env.js
```

### **🔒 SSL Certificates**

**Development (Self-signed):**
```bash
# Generate self-signed certificates
cd docker/ssl
bash generate-certs.sh  # Linux/macOS
# OR
powershell -File generate-certs.ps1  # Windows
```

**Production (Let's Encrypt):**
```bash
# Certificates are automatically managed by cert-manager in Kubernetes
# For Docker Compose, use external certificate provider
```

### **📊 Monitoring Configuration**

**Grafana Access:**
- URL: http://localhost:3001
- Username: admin
- Password: Set via `GRAFANA_ADMIN_PASSWORD` environment variable

**Prometheus Targets:**
- Application metrics: http://app:3000/api/metrics
- Health checks: http://app:3000/api/health
- System metrics: Various exporters

---

## 🔧 **SCALING & PERFORMANCE**

### **📈 Horizontal Scaling**

**Docker Compose:**
```bash
# Scale application instances
docker-compose -f docker-compose.prod.yml up -d --scale app-1=3 --scale app-2=3
```

**Kubernetes Auto-scaling:**
```bash
# HPA automatically scales based on:
# - CPU utilization (70%)
# - Memory utilization (80%)  
# - Custom metrics (predictions/sec, response time)

# Manual scaling
kubectl scale deployment trendzo-app --replicas=10 -n trendzo-production

# Check HPA status
kubectl get hpa -n trendzo-production
```

### **⚡ Performance Tuning**

**Resource Limits:**
```yaml
# In deployment.yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi" 
    cpu: "1000m"
```

**Cache Configuration:**
```bash
# Redis cache settings
REDIS_URL=redis://redis:6379
CACHE_TTL_SECONDS=300
```

---

## 🛡️ **SECURITY FEATURES**

### **🔐 Container Security**
- ✅ Non-root user execution
- ✅ Read-only root filesystem
- ✅ Capability dropping
- ✅ Security context constraints
- ✅ Image vulnerability scanning

### **🌐 Network Security**
- ✅ SSL/TLS encryption
- ✅ Security headers (HSTS, CSP, XSS)
- ✅ API rate limiting
- ✅ CORS configuration
- ✅ Network segmentation

### **🔑 Secret Management**
- ✅ Environment-based secrets
- ✅ Kubernetes secrets
- ✅ Secret rotation support
- ✅ Access control (RBAC)

---

## 📊 **MONITORING & OBSERVABILITY**

### **📈 Metrics (Prometheus)**
- Application performance metrics
- Business metrics (predictions, accuracy)
- Infrastructure metrics (CPU, memory, disk)
- Custom application metrics

### **📋 Logging (Loki)**
- Application logs
- Access logs (Nginx)
- Error logs
- Structured logging with correlation IDs

### **🔍 Tracing (Jaeger)**
- Distributed request tracing
- Performance bottleneck identification
- Dependency mapping

### **📊 Dashboards (Grafana)**
- Pre-built application dashboard
- System resource monitoring
- Business metrics visualization
- Alert management

---

## 🚨 **TROUBLESHOOTING**

### **🔍 Common Issues**

**Application Won't Start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app-1

# Check health endpoint
curl http://localhost/api/health

# Validate environment
node docker/environment/validate-env.js
```

**SSL Certificate Issues:**
```bash
# Regenerate certificates
cd docker/ssl
rm *.crt *.key
bash generate-certs.sh
```

**Database Connection Issues:**
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" "YOUR_SUPABASE_URL/rest/v1/"
```

**Memory Issues:**
```bash
# Check container resource usage
docker stats

# Adjust memory limits in docker-compose.prod.yml
```

### **📋 Health Checks**

**Application Health:**
```bash
curl http://localhost/api/health
```

**Service Status:**
```bash
# All services status
./deploy.sh --status

# Individual service health
docker-compose -f docker-compose.prod.yml ps
```

### **🔧 Debugging**

**Container Shell Access:**
```bash
# Access running container
docker exec -it trendzo-app-1-prod sh

# Check application logs
docker logs trendzo-app-1-prod -f
```

**Kubernetes Debugging:**
```bash
# Pod status
kubectl get pods -n trendzo-production

# Pod logs
kubectl logs -f pod/trendzo-app-xxx -n trendzo-production

# Pod shell access
kubectl exec -it pod/trendzo-app-xxx -n trendzo-production -- sh
```

---

## 📚 **ADDITIONAL RESOURCES**

### **🔗 Documentation Links**
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/docs/)

### **🎯 Production Checklist**
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Monitoring dashboards set up
- [ ] Backup strategy implemented
- [ ] Security scan completed
- [ ] Load testing performed
- [ ] Disaster recovery plan documented

---

## 🆘 **SUPPORT**

**For deployment issues:**
1. Check the troubleshooting section above
2. Review service logs: `./deploy.sh --logs`
3. Validate environment: `node docker/environment/validate-env.js`
4. Check service health: `./deploy.sh --status`

**Performance optimization:**
1. Monitor Grafana dashboards
2. Check resource usage: `docker stats`
3. Review application logs for bottlenecks
4. Adjust scaling parameters in HPA

---

## 🎉 **DEPLOYMENT SUCCESS**

**Your Trendzo viral prediction platform is now running with:**

- ✅ **Ultra-fast prediction engine** (6-38ms response times)
- ✅ **Production-grade security** (SSL, rate limiting, security headers)
- ✅ **Auto-scaling infrastructure** (horizontal and vertical scaling)
- ✅ **Comprehensive monitoring** (metrics, logs, tracing, dashboards)
- ✅ **High availability** (load balancing, health checks, failover)
- ✅ **Enterprise security** (container hardening, secret management)

**🚀 Ready for production traffic at scale!**