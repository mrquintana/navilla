# Terraform Infrastructure

This directory contains Terraform configurations for deploying Navilla infrastructure to AWS.

## Architecture

### Staging Environment

Simple, cost-effective setup for MVP validation:

```
┌─────────────────────────────────────────┐
│           EC2 (t3.micro)                │
│  ┌─────────────────────────────────┐    │
│  │         Nginx (reverse proxy)   │    │
│  │         + Let's Encrypt SSL     │    │
│  └──────────┬──────────┬───────────┘    │
│             │          │                │
│  ┌──────────▼───┐  ┌───▼──────────┐    │
│  │   Frontend   │  │   Backend    │    │
│  │  (container) │  │  (container) │    │
│  └──────────────┘  └──────────────┘    │
│                                         │
│         Docker Compose                  │
└─────────────────────────────────────────┘
              ↓
         Supabase (external)
```

**Estimated cost**: ~$8-15/month

## Prerequisites

1. AWS account with appropriate permissions
2. Terraform >= 1.0 installed
3. AWS CLI configured
4. SSH key pair created in AWS

## Setup

### 1. Configure Variables

```bash
cd terraform/staging
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan and Apply

```bash
# Preview changes
terraform plan

# Apply changes
terraform apply
```

### 4. Get Outputs

```bash
terraform output
```

## GitHub Actions Secrets

For CI/CD deployment, configure these secrets in your GitHub repository:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_KEY_NAME` | SSH key pair name |
| `STAGING_HOST` | EC2 public IP (after terraform apply) |
| `STAGING_SSH_KEY` | Private SSH key content |
| `GHCR_TOKEN` | GitHub token with packages:read |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `ENCRYPTION_PEPPER` | Encryption pepper for sensitive data |

And these variables:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |

## Manual Deployment

SSH into the server and run:

```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<public-ip>

# Deploy latest images
cd /opt/navilla
# TODO: Replace YOUR_GHCR_TOKEN and YOUR_USERNAME with actual values
echo "YOUR_GHCR_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
docker-compose pull
docker-compose up -d
```

## SSL Setup (Optional)

If you have a domain name:

```bash
# SSH into server
# TODO: Replace your-domain.com with your actual domain name
sudo certbot --nginx -d your-domain.com
```

## Destroying Infrastructure

```bash
terraform destroy
```

Or via GitHub Actions: Run the Terraform workflow with action = "destroy"

## Future Scaling

When ready to scale beyond MVP:

1. **Add ALB** for load balancing
2. **Use ECS Fargate** for container orchestration
3. **Add CloudFront** for CDN
4. **Enable auto-scaling** based on traffic
5. **Add RDS** if moving away from Supabase
