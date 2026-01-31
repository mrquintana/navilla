output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.navilla_staging.id
}

output "public_ip" {
  description = "Public IP address (Elastic IP)"
  value       = aws_eip.navilla_staging.public_ip
}

output "public_dns" {
  description = "Public DNS name"
  value       = aws_eip.navilla_staging.public_dns
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_eip.navilla_staging.public_ip}"
}

output "staging_url" {
  description = "Staging environment URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_eip.navilla_staging.public_ip}"
}
