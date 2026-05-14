locals {
  compose_yaml = file(var.compose_file_path)

  # Indent every line by 6 spaces so it sits cleanly inside cloud-init's
  # write_files[].content block (4-space list-item indent + 2-space content indent).
  compose_yaml_indented = join("\n", [
    for line in split("\n", local.compose_yaml) : "      ${line}"
  ])

  cloud_init = templatefile("${path.module}/cloud-init.yaml.tftpl", {
    admin_username        = var.admin_username
    compose_yaml_indented = local.compose_yaml_indented
  })
}

resource "azurerm_network_interface" "this" {
  name                = "nic-${var.name_prefix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  tags                = var.tags

  ip_configuration {
    name                          = "ipcfg-primary"
    subnet_id                     = var.subnet_id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = var.public_ip_id
  }
}

resource "azurerm_linux_virtual_machine" "this" {
  name                            = "vm-${var.name_prefix}"
  resource_group_name             = var.resource_group_name
  location                        = var.location
  size                            = var.vm_size
  admin_username                  = var.admin_username
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.this.id]
  tags                            = var.tags

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  os_disk {
    name                 = "osdisk-${var.name_prefix}"
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = 64
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(local.cloud_init)
}
