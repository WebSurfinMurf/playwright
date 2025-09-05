#!/bin/bash
set -e

PROJECT_NAME="playwright"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🎭 Deploying Playwright service...${NC}"

# Load environment
if [ -f "/home/administrator/secrets/${PROJECT_NAME}.env" ]; then
    source /home/administrator/secrets/${PROJECT_NAME}.env
    echo -e "${GREEN}✓${NC} Environment loaded"
else
    echo -e "${RED}✗${NC} Environment file not found at /home/administrator/secrets/${PROJECT_NAME}.env"
    exit 1
fi

# Stop existing container
echo -e "${YELLOW}Stopping existing container...${NC}"
docker stop ${PROJECT_NAME} 2>/dev/null || true
docker rm ${PROJECT_NAME} 2>/dev/null || true

# Build the image
echo -e "${YELLOW}Building Playwright Docker image...${NC}"
docker build -t ${PROJECT_NAME}:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}✗${NC} Docker build failed"
    exit 1
fi

# Create data volumes
echo -e "${YELLOW}Creating data directories...${NC}"
mkdir -p /home/administrator/projects/playwright/data/{reports,screenshots,videos,traces}

# Deploy with Traefik
echo -e "${YELLOW}Deploying container...${NC}"
docker run -d \
  --name ${PROJECT_NAME} \
  --restart unless-stopped \
  --network traefik-proxy \
  --env-file /home/administrator/secrets/${PROJECT_NAME}.env \
  --volume /home/administrator/projects/playwright/data/reports:/app/reports \
  --volume /home/administrator/projects/playwright/data/screenshots:/app/screenshots \
  --volume /home/administrator/projects/playwright/data/videos:/app/videos \
  --volume /home/administrator/projects/playwright/data/traces:/app/traces \
  --label "traefik.enable=true" \
  --label "traefik.docker.network=traefik-proxy" \
  --label "traefik.http.routers.${PROJECT_NAME}.rule=Host(\`${PROJECT_NAME}.ai-servicers.com\`)" \
  --label "traefik.http.routers.${PROJECT_NAME}.entrypoints=websecure" \
  --label "traefik.http.routers.${PROJECT_NAME}.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.${PROJECT_NAME}.loadbalancer.server.port=${APP_PORT:-3000}" \
  ${PROJECT_NAME}:latest

# Connect to additional networks
echo -e "${YELLOW}Connecting to networks...${NC}"
docker network connect redis-net ${PROJECT_NAME} 2>/dev/null || echo "Redis network not available"

# Wait for container to start
echo -e "${YELLOW}Waiting for service to start...${NC}"
sleep 10

# Verify deployment
if docker ps | grep -q ${PROJECT_NAME}; then
    echo -e "${GREEN}✓${NC} Container running"
    
    # Test health endpoint
    health_url="http://localhost:${APP_PORT:-3000}/health"
    if curl -f -s ${health_url} > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Health check passed"
    else
        echo -e "${YELLOW}⚠${NC} Health check not available yet"
    fi
    
    echo ""
    echo -e "${GREEN}🎭 Playwright service deployed successfully!${NC}"
    echo -e "🌐 Web interface: https://${PROJECT_NAME}.ai-servicers.com"
    echo -e "🔗 API endpoint: https://${PROJECT_NAME}.ai-servicers.com/api"
    echo -e "📊 Health check: https://${PROJECT_NAME}.ai-servicers.com/health"
    echo ""
    echo "Container logs: docker logs ${PROJECT_NAME}"
    echo "Container shell: docker exec -it ${PROJECT_NAME} /bin/bash"
else
    echo -e "${RED}✗${NC} Deployment failed"
    echo "Check logs with: docker logs ${PROJECT_NAME}"
    exit 1
fi