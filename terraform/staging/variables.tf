variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro" # Free tier eligible, upgrade to t3.small if needed
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR blocks allowed to SSH (restrict to your IP)"
  type        = list(string)
  default     = ["0.0.0.0/0"] # TODO: Restrict this in production
}

variable "domain_name" {
  description = "Domain name for the staging environment"
  type        = string
  default     = "" # Leave empty to skip SSL setup
}

variable "ghcr_username" {
  description = "GitHub username for GHCR"
  type        = string
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
}

variable "supabase_project_ref" {
  description = "Supabase project reference ID (e.g., 'abcdefghijkl' from abcdefghijkl.supabase.co)"
  type        = string
}

variable "supabase_pooler_host" {
  description = "Supabase connection pooler hostname (e.g., 'aws-0-us-west-2.pooler.supabase.com')"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_db_password" {
  description = "Supabase PostgreSQL database password"
  type        = string
  sensitive   = true
}

variable "encryption_pepper" {
  description = "Encryption pepper for sensitive data"
  type        = string
  sensitive   = true
}

variable "database_url" {
  description = "Database JDBC URL (direct or pooler)"
  type        = string
  sensitive   = true
}

variable "database_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "api_url" {
  description = "Backend API URL (will use EIP address)"
  type        = string
  default     = "http://54.159.90.88"
}
