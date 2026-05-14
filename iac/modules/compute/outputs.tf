output "vm_id" {
  value = azurerm_linux_virtual_machine.this.id
}

output "vm_name" {
  value = azurerm_linux_virtual_machine.this.name
}

output "admin_username" {
  value = azurerm_linux_virtual_machine.this.admin_username
}

output "nic_id" {
  value = azurerm_network_interface.this.id
}
