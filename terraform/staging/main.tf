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

# Enable IPv6 on default VPC
resource "aws_vpc_ipv6_cidr_block_association" "default" {
  vpc_id                           = data.aws_vpc.default.id
  assign_generated_ipv6_cidr_block = true
}

# Create new subnet with IPv6 (using unused CIDR range)
resource "aws_subnet" "ipv6_enabled" {
  vpc_id                          = data.aws_vpc.default.id
  cidr_block                      = "172.31.128.0/24"
  ipv6_cidr_block                 = cidrsubnet(aws_vpc_ipv6_cidr_block_association.default.ipv6_cidr_block, 8, 128)
  assign_ipv6_address_on_creation = true
  availability_zone               = "${var.aws_region}a"
  map_public_ip_on_launch         = true

  tags = {
    Name = "navilla-staging-ipv6"
  }
}

# Get default internet gateway
data "aws_internet_gateway" "default" {
  filter {
    name   = "attachment.vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Get default route table
data "aws_route_table" "default" {
  vpc_id = data.aws_vpc.default.id

  filter {
    name   = "association.main"
    values = ["true"]
  }
}

# Add IPv6 route to internet gateway
resource "aws_route" "ipv6_default" {
  route_table_id              = data.aws_route_table.default.id
  destination_ipv6_cidr_block = "::/0"
  gateway_id                  = data.aws_internet_gateway.default.id
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
  subnet_id              = aws_subnet.ipv6_enabled.id

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
    api_url              = var.api_url
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
