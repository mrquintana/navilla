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

# Get default VPC
data "aws_vpc" "default" {
  default = true
}

# Get default subnet
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "availability-zone"
    values = ["${var.aws_region}a"]
  }
}

# Enable IPv6 on default VPC
resource "aws_vpc_ipv6_cidr_block_association" "default" {
  vpc_id = data.aws_vpc.default.id
}

# Enable IPv6 on subnet
resource "aws_subnet" "ipv6_enabled" {
  count = length(data.aws_subnets.default.ids) > 0 ? 1 : 0

  vpc_id                          = data.aws_vpc.default.id
  cidr_block                      = cidrsubnet(data.aws_vpc.default.cidr_block, 4, 1)
  ipv6_cidr_block                 = cidrsubnet(aws_vpc_ipv6_cidr_block_association.default.ipv6_cidr_block, 8, 1)
  assign_ipv6_address_on_creation = true
  availability_zone               = "${var.aws_region}a"

  tags = {
    Name = "navilla-staging-ipv6"
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

  # Allow all outbound IPv4
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound IPv4"
  }

  # Allow all outbound IPv6
  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    ipv6_cidr_blocks = ["::/0"]
    description      = "Allow all outbound IPv6"
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
  subnet_id              = length(aws_subnet.ipv6_enabled) > 0 ? aws_subnet.ipv6_enabled[0].id : null

  # Enable IPv6
  ipv6_address_count = 1

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    domain_name          = var.domain_name
    ghcr_username        = var.ghcr_username
    supabase_url         = var.supabase_url
    supabase_anon_key    = var.supabase_anon_key
    supabase_project_ref = var.supabase_project_ref
    supabase_pooler_host = var.supabase_pooler_host
    supabase_db_password = var.supabase_db_password
    database_url         = var.database_url
    database_username    = var.database_username
    database_password    = var.database_password
    encryption_pepper    = var.encryption_pepper
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
