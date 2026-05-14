variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "public_ip_id" {
  type = string
}

variable "vm_size" {
  type = string
}

variable "admin_username" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

variable "compose_file_path" {
  description = "Absolute path (or relative to root) to docker-compose-prod.yml that will be baked into cloud-init."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
