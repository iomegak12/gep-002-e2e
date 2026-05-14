variable "name_prefix" {
  type = string
}

variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "dns_label" {
  description = "domain_name_label for the public IP."
  type        = string
}

variable "admin_cidr" {
  description = "CIDR allowed for SSH/DB/admin/backend ports."
  type        = string
}

variable "vnet_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.20.1.0/24"
}

variable "tags" {
  type    = map(string)
  default = {}
}
