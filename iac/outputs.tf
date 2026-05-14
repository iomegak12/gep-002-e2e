output "ssh_command" {
  description = "Ready-to-run SSH command to connect to the Azure VM."
  value       = "ssh -i ${module.ssh_key.private_key_path} ${var.admin_username}@${module.network.fqdn}"
}

output "fqdn" {
  description = "Public DNS name of the VM."
  value       = module.network.fqdn
}

output "public_ip" {
  description = "Static public IP address of the VM."
  value       = module.network.public_ip_address
}

output "web_url" {
  description = "Public URL of the GEP web application."
  value       = "http://${module.network.fqdn}:8080"
}

output "admin_cidr_used" {
  description = "CIDR whitelisted for SSH, DB, admin UI and backend API access."
  value       = local.admin_cidr
}

output "resource_group_name" {
  description = "Name of the Azure resource group."
  value       = module.identity.resource_group_name
}

output "private_key_path" {
  description = "Local path to the generated SSH private key."
  value       = module.ssh_key.private_key_path
  sensitive   = true
}
