output "public_key_openssh" {
  value = tls_private_key.this.public_key_openssh
}

output "private_key_path" {
  value = local.private_key_path
}

output "public_key_path" {
  value = local.public_key_path
}
