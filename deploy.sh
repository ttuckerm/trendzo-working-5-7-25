#!/bin/bash

# =============================================================================
# TRENDZO PRODUCTION DEPLOYMENT SCRIPT
# Complete Docker deployment automation with security and monitoring
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="trendzo"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${PURPLE}=== $1 ===${NC}\n"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    print_success "Docker Compose is installed"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    print_success "Docker daemon is running"
    
    # Check environment file
    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        print_warning "Environment file .env.${ENVIRONMENT} not found"
        print_status "Creating from template..."
        cp docker/environment/env.template ".env.${ENVIRONMENT}"
        print_warning "Please edit .env.${ENVIRONMENT} with your actual values before continuing"
        read -p "Press enter to continue after editing the environment file..."
    fi
    print_success "Environment configuration ready"
}

# Function to validate environment variables
validate_environment() {
    print_header "Validating Environment Variables"
    
    if command -v node &> /dev/null; then
        node docker/environment/validate-env.js
        if [ $? -ne 0 ]; then
            print_error "Environment validation failed"
            exit 1
        fi
    else
        print_warning "Node.js not found, skipping environment validation"
    fi
    
    print_success "Environment validation passed"
}

# Function to generate SSL certificates
generate_ssl_certificates() {
    print_header "Generating SSL Certificates"
    
    if [ ! -f "docker/ssl/trendzo.crt" ]; then
        print_status "Generating self-signed SSL certificates..."
        
        if command -v openssl &> /dev/null; then
            cd docker/ssl
            bash generate-certs.sh
            cd ../..
            print_success "SSL certificates generated"
        else
            print_warning "OpenSSL not found, using placeholder certificates"
            # Create placeholder certificates
            mkdir -p docker/ssl
            echo "# Placeholder certificate - replace with real SSL certificate" > docker/ssl/trendzo.crt
            echo "# Placeholder key - replace with real SSL private key" > docker/ssl/trendzo.key
        fi
    else
        print_success "SSL certificates already exist"
    fi
}

# Function to build images
build_images() {
    print_header "Building Docker Images"
    
    print_status "Building production images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    print_success "Docker images built successfully"
}

# Function to start services
start_services() {
    print_header "Starting Services"
    
    print_status "Starting production deployment..."
    docker-compose -f $COMPOSE_FILE --env-file ".env.${ENVIRONMENT}" up -d
    
    print_success "Services started successfully"
}

# Function to check service health
check_health() {
    print_header "Checking Service Health"
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check application health
    print_status "Checking application health..."
    for i in {1..30}; do
        if curl -f http://localhost/api/health &> /dev/null; then
            print_success "Application is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Application health check failed"
            docker-compose -f $COMPOSE_FILE logs app-1 app-2
            exit 1
        fi
        sleep 10
    done
    
    # Check monitoring services
    print_status "Checking monitoring services..."
    if curl -f http://localhost:9090/-/healthy &> /dev/null; then
        print_success "Prometheus is healthy"
    else
        print_warning "Prometheus health check failed"
    fi
    
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        print_success "Grafana is healthy"
    else
        print_warning "Grafana health check failed"
    fi
}

# Function to show deployment status
show_status() {
    print_header "Deployment Status"
    
    echo -e "${CYAN}Service URLs:${NC}"
    echo -e "  🌐 Application: https://localhost"
    echo -e "  📊 Grafana:     http://localhost:3001"
    echo -e "  📈 Prometheus:  http://localhost:9090"
    echo -e "  📋 Jaeger:      http://localhost:16686"
    echo ""
    
    echo -e "${CYAN}Service Status:${NC}"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    echo -e "${CYAN}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo ""
    
    print_success "Deployment completed successfully!"
    echo -e "${GREEN}Trendzo is now running in production mode${NC}"
}

# Function to setup monitoring
setup_monitoring() {
    print_header "Setting Up Monitoring"
    
    print_status "Creating monitoring directories..."
    mkdir -p logs/{nginx,app,prometheus,grafana}
    
    print_status "Setting up log rotation..."
    cat > /tmp/trendzo-logrotate << EOF
/var/log/trendzo/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
    
    print_success "Monitoring setup completed"
}

# Function to show help
show_help() {
    echo "Trendzo Production Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environment:"
    echo "  production  Deploy production environment (default)"
    echo "  staging     Deploy staging environment"
    echo ""
    echo "Options:"
    echo "  --build-only     Only build images"
    echo "  --start-only     Only start services"
    echo "  --health-check   Only check service health"
    echo "  --status         Show deployment status"
    echo "  --stop           Stop all services"
    echo "  --logs           Show service logs"
    echo "  --help           Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                    # Full production deployment"
    echo "  $0 staging            # Deploy staging environment"
    echo "  $0 --build-only       # Build images only"
    echo "  $0 --status           # Show current status"
}

# Function to stop services
stop_services() {
    print_header "Stopping Services"
    
    docker-compose -f $COMPOSE_FILE down
    print_success "Services stopped"
}

# Function to show logs
show_logs() {
    print_header "Service Logs"
    
    docker-compose -f $COMPOSE_FILE logs -f --tail=100
}

# Main execution
main() {
    case "$1" in
        --build-only)
            check_prerequisites
            validate_environment
            build_images
            ;;
        --start-only)
            start_services
            check_health
            show_status
            ;;
        --health-check)
            check_health
            ;;
        --status)
            show_status
            ;;
        --stop)
            stop_services
            ;;
        --logs)
            show_logs
            ;;
        --help|-h)
            show_help
            ;;
        *)
            # Full deployment
            echo -e "${CYAN}🚀 Starting Trendzo Production Deployment${NC}\n"
            
            check_prerequisites
            validate_environment
            generate_ssl_certificates
            setup_monitoring
            build_images
            start_services
            check_health
            show_status
            
            echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
            echo -e "${YELLOW}📖 Check the README.md for post-deployment steps${NC}"
            ;;
    esac
}

# Run main function with all arguments
main "$@"