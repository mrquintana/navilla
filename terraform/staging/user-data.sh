#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/user-data.log) 2>&1
echo "Starting user-data script at $(date)"

# Update system
dnf update -y

# Install Docker
dnf install -y docker
systemctl enable docker
systemctl start docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install Docker Compose
DOCKER_COMPOSE_VERSION="v2.24.0"
curl -L "https://github.com/docker/compose/releases/download/$${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Nginx
dnf install -y nginx
systemctl enable nginx

# Install certbot for SSL (optional)
dnf install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p /opt/navilla
cd /opt/navilla

# Create .env file
cat > /opt/navilla/.env << 'ENV_EOF'
SUPABASE_URL=${supabase_url}
SUPABASE_ANON_KEY=${supabase_anon_key}
DATABASE_URL=${database_url}
DATABASE_USERNAME=${database_username}
DATABASE_PASSWORD=${database_password}
ENCRYPTION_PEPPER=${encryption_pepper}
ENV_EOF

# Create docker-compose.yml
cat > /opt/navilla/docker-compose.yml << 'COMPOSE_EOF'
services:
  backend:
    image: ghcr.io/${ghcr_username}/navilla/backend:latest
    container_name: navilla-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=staging
      - SUPABASE_URL=$${SUPABASE_URL}
      - SUPABASE_ANON_KEY=$${SUPABASE_ANON_KEY}
      - DATABASE_URL=$${DATABASE_URL}
      - DATABASE_USERNAME=$${DATABASE_USERNAME}
      - DATABASE_PASSWORD=$${DATABASE_PASSWORD}
      - ENCRYPTION_PEPPER=$${ENCRYPTION_PEPPER}
      - JAVA_OPTS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseG1GC -XX:+UseStringDeduplication -Djava.security.egd=file:/dev/./urandom -Dspring.profiles.active=staging
    env_file:
      - .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  frontend:
    image: ghcr.io/${ghcr_username}/navilla/frontend:latest
    container_name: navilla-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - VITE_SUPABASE_URL=$${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=$${SUPABASE_ANON_KEY}
      - VITE_API_URL=http://54.159.90.88
    depends_on:
      - backend
COMPOSE_EOF

# Create Nginx config
cat > /etc/nginx/conf.d/navilla.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name ${domain_name} _;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /actuator/health {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINX_EOF

# Remove default nginx config
rm -f /etc/nginx/conf.d/default.conf

# Create deploy script
cat > /opt/navilla/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

cd /opt/navilla

# Login to GHCR (token passed as argument or from env)
if [ -n "$1" ]; then
    echo "$1" | docker login ghcr.io -u ${ghcr_username} --password-stdin
fi

# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Clean up old images
docker image prune -f

echo "Deployment complete at $(date)"
DEPLOY_EOF
chmod +x /opt/navilla/deploy.sh

# Start Nginx
systemctl start nginx

echo "User-data script completed at $(date)"
echo "Note: Run /opt/navilla/deploy.sh with GHCR token to deploy containers"
