variable "subscription_id" {
  description = "Azure subscription ID. Leave null to use ARM_SUBSCRIPTION_ID env var or az CLI default."
  type        = string
  default     = null
}

variable "project" {
  description = "Project name prefix used for resource naming."
  type        = string
  default     = "gep-002"
}

variable "environment" {
  description = "Environment suffix (e.g. demo, dev, prod)."
  type        = string
  default     = "demo"
}

variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "West US"
}

variable "dns_label" {
  description = "Public IP domain_name_label. Final FQDN is <label>.<region>.cloudapp.azure.com."
  type        = string
  default     = "gep-002-demo"
}

variable "vm_size" {
  description = "Azure VM SKU."
  type        = string
  default     = "Standard_D2s_v5"
}

variable "admin_username" {
  description = "Linux admin user on the VM."
  type        = string
  default     = "azureuser"
}

variable "admin_cidr_override" {
  description = "Optional CIDR to whitelist for SSH/DB/admin-UI/backend-API access. When null, the operator's current public IP is auto-detected via ipify."
  type        = string
  default     = null
}

variable "compose_file_path" {
  description = "Path to docker-compose-prod.yml relative to the iac/ directory."
  type        = string
  default     = "../docker-compose-prod.yml"
}
