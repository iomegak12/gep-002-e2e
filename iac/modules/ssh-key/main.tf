resource "tls_private_key" "this" {
  algorithm = "ED25519"
}

locals {
  private_key_path = "${var.output_dir}/id_ed25519"
  public_key_path  = "${var.output_dir}/id_ed25519.pub"
}

resource "local_sensitive_file" "private_key" {
  filename        = local.private_key_path
  content         = tls_private_key.this.private_key_openssh
  file_permission = "0600"
}

resource "local_file" "public_key" {
  filename        = local.public_key_path
  content         = tls_private_key.this.public_key_openssh
  file_permission = "0644"
}

resource "null_resource" "restrict_private_key_acl" {
  triggers = {
    key_id = tls_private_key.this.id
    path   = local.private_key_path
  }

  provisioner "local-exec" {
    interpreter = ["pwsh", "-NoProfile", "-Command"]
    command     = <<-EOT
      $p = '${local.private_key_path}'
      icacls $p /inheritance:r | Out-Null
      icacls $p /grant:r "$($env:USERNAME):F" | Out-Null
      icacls $p /remove "Authenticated Users" "BUILTIN\Users" "Everyone" "NT AUTHORITY\Authenticated Users" 2>$null | Out-Null
      Write-Host "ACL hardened for $p (owner-only access)."
    EOT
  }

  depends_on = [local_sensitive_file.private_key]
}
