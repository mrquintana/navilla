terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Store state in S3 (optional - can use local state for MVP)
  # backend "s3" {
  #   bucket = "navilla-terraform-state"
  #   key    = "staging/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "navilla"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security group for the EC2 instance
resource "aws_security_group" "navilla_staging" {
  name        = "navilla-staging-sg"
  description = "Security group for Navilla staging server"

  # SSH access (restrict to your IP in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidr
    description = "SSH access"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "navilla-staging-sg"
  }
}

# EC2 instance
resource "aws_instance" "navilla_staging" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.navilla_staging.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    domain_name      = var.domain_name
    ghcr_username    = var.ghcr_username
    supabase_url     = var.supabase_url
    supabase_anon_key = var.supabase_anon_key
  }))

  tags = {
    Name = "navilla-staging"
  }
}

# Elastic IP for stable address
resource "aws_eip" "navilla_staging" {
  instance = aws_instance.navilla_staging.id
  domain   = "vpc"

  tags = {
    Name = "navilla-staging-eip"
  }
}
