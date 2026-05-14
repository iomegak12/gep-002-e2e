data "http" "myip" {
  url = "https://api.ipify.org"
}

locals {
  name_prefix = "${var.project}-${var.environment}"
  admin_cidr  = coalesce(var.admin_cidr_override, "${chomp(data.http.myip.response_body)}/32")

  tags = {
    project     = var.project
    environment = var.environment
    managed_by  = "terraform"
  }
}

module "identity" {
  source = "./modules/identity"

  name_prefix = local.name_prefix
  location    = var.location
  tags        = local.tags
}

module "ssh_key" {
  source = "./modules/ssh-key"

  name_prefix = local.name_prefix
  output_dir  = "${path.root}/.secrets"
}

module "network" {
  source = "./modules/network"

  name_prefix         = local.name_prefix
  location            = var.location
  resource_group_name = module.identity.resource_group_name
  dns_label           = var.dns_label
  admin_cidr          = local.admin_cidr
  tags                = local.tags
}

module "compute" {
  source = "./modules/compute"

  name_prefix         = local.name_prefix
  location            = var.location
  resource_group_name = module.identity.resource_group_name
  subnet_id           = module.network.subnet_id
  public_ip_id        = module.network.public_ip_id
  vm_size             = var.vm_size
  admin_username      = var.admin_username
  ssh_public_key      = module.ssh_key.public_key_openssh
  compose_file_path   = "${path.root}/${var.compose_file_path}"
  tags                = local.tags
}
