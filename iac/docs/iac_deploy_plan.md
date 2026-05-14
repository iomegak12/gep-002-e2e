# Plan: Azure Terraform IaC for GEP demo stack

## Context

Deploy the GEP e-procurement stack (defined in [docker-compose-prod.yml](docker-compose-prod.yml) — Postgres, Mongo, IAM/Supplier/PO services, seed, web/nginx SPA, cloudbeaver, mongo-express) onto a single Azure VM via Terraform. The IaC must be modular, generate a local SSH key with user-only permissions, expose only the SPA (port 8080) publicly, and lock everything else (databases, admin UIs, backend APIs, SSH) to the operator's current public IP. The compose file is dropped onto the VM via cloud-init and the stack starts on first boot.

Working directory for IaC: [iac/](iac/) (currently empty — greenfield).

Discovery note: [gep-front-end/web/nginx.conf:23-45](gep-front-end/web/nginx.conf#L23-L45) already reverse-proxies `/iam/`, `/supplier/`, `/po/` to backend containers over the docker network. The SPA needs only port 8080 to be publicly reachable; the host-exposed 3001-3003 ports are not required for end-user traffic and will be NSG-restricted to the operator's IP for debugging.

## Decisions (confirmed)

| Topic | Choice |
|---|---|
| Cloud | Azure, region `West US` |
| VM | `Standard_D2s_v5`, Ubuntu 22.04 LTS |
| Public NSG | 80/443 closed, 8080 → 0.0.0.0/0; 22, 3001-3003, 5432, 27017, 8081, 8978 → operator IP only |
| Operator IP | Auto-detected at apply time via `http` data source (`https://api.ipify.org`) |
| SSH key | Generated locally with `tls_private_key` (Ed25519), written to `./.secrets/id_ed25519` with file mode `0600` (Windows ACL handled via `local-exec` icacls) |
| Provisioning | Pure cloud-init: installs Docker + compose plugin, writes the YAML inline, runs `docker compose up -d` once |
| DNS | Azure public IP `domain_name_label` → `<label>.westus.cloudapp.azure.com`. Default label `gep-002-demo`, override via tfvars |
| Terraform state | Local backend, `.gitignore` covers `.tfstate*` and `.secrets/` |

## Module layout

```
iac/
├── main.tf                      # provider, module wiring, locals
├── variables.tf                 # all inputs
├── outputs.tf                   # ssh_command, fqdn, public_ip, web_url
├── terraform.tfvars             # user-editable values
├── versions.tf                  # required_providers, terraform >= 1.6
├── .gitignore                   # .tfstate*, .secrets/, .terraform/
└── modules/
    ├── network/                 # vnet, subnet, NSG + rules, public IP
    │   ├── main.tf  variables.tf  outputs.tf
    ├── ssh-key/                 # tls_private_key + local_file + icacls
    │   ├── main.tf  variables.tf  outputs.tf
    ├── compute/                 # NIC, linux VM, cloud-init template
    │   ├── main.tf  variables.tf  outputs.tf
    │   └── cloud-init.yaml.tftpl
    └── identity/                # optional resource group (kept thin)
        └── main.tf  variables.tf  outputs.tf
```

## Module responsibilities

### `modules/identity`
- `azurerm_resource_group` named from `var.project` + `var.environment` (e.g. `rg-gep-002-demo`), location `var.location`.

### `modules/ssh-key`
- `tls_private_key { algorithm = "ED25519" }`
- `local_sensitive_file` → `${path.root}/.secrets/id_ed25519` (private) and `id_ed25519.pub` (public).
- `null_resource` with `local-exec` running PowerShell `icacls` to strip inheritance and grant only `$env:USERNAME:F` (Windows). For cross-platform, conditionally call `chmod 600` on non-Windows via `interpreter = ["pwsh","-Command"]` detection — but since the user's environment is Windows, ship the icacls path as primary.
- Outputs: `public_key_openssh`, `private_key_path`.

### `modules/network`
- `azurerm_virtual_network` (`10.20.0.0/16`)
- `azurerm_subnet` (`10.20.1.0/24`)
- `azurerm_public_ip` with `allocation_method = "Static"`, `sku = "Standard"`, `domain_name_label = var.dns_label` (default `gep-002-demo`).
- `azurerm_network_security_group` with rules built from a `locals` map:
  - **Public**: TCP 8080 from `*`
  - **Operator-only** (source = `${chomp(data.http.myip.response_body)}/32`): TCP 22, 3001, 3002, 3003, 5432, 27017, 8081, 8978
  - Default deny inherited.
- `data "http" "myip" { url = "https://api.ipify.org" }` defined at root, passed in as `var.admin_cidr` (with optional tfvars override).
- `azurerm_subnet_network_security_group_association`.
- Outputs: `subnet_id`, `public_ip_id`, `public_ip_address`, `fqdn`.

### `modules/compute`
- `azurerm_network_interface` bound to subnet + public IP.
- `azurerm_linux_virtual_machine`:
  - `size = "Standard_D2s_v5"`, `admin_username = var.admin_username` (default `azureuser`)
  - `admin_ssh_key { username, public_key }` from ssh-key module
  - `source_image_reference` → Canonical 22_04-lts-gen2
  - `os_disk { caching = "ReadWrite", storage_account_type = "Premium_LRS" }`
  - `custom_data = base64encode(templatefile("cloud-init.yaml.tftpl", { compose_yaml = file("${path.module}/../../../docker-compose-prod.yml") }))`
- **cloud-init template** does:
  1. `apt-get update && apt-get install -y ca-certificates curl gnupg`
  2. Install Docker CE + compose plugin via official `download.docker.com` apt repo
  3. `usermod -aG docker ${admin_username}`
  4. `write_files`: drops the compose YAML at `/opt/gep/docker-compose.yml` (content injected via template var)
  5. `runcmd`: `cd /opt/gep && docker compose -f docker-compose.yml up -d`
- Output: `vm_id`, `admin_username`.

## Root `main.tf` wiring

```hcl
data "http" "myip" { url = "https://api.ipify.org" }

locals {
  admin_cidr = coalesce(var.admin_cidr_override, "${chomp(data.http.myip.response_body)}/32")
}

module "identity" { source = "./modules/identity"  ... }
module "ssh_key"  { source = "./modules/ssh-key"   ... }
module "network"  { source = "./modules/network"   admin_cidr = local.admin_cidr  ... }
module "compute"  {
  source              = "./modules/compute"
  ssh_public_key      = module.ssh_key.public_key_openssh
  subnet_id           = module.network.subnet_id
  nic_public_ip_id    = module.network.public_ip_id
  compose_file_path   = "${path.root}/../docker-compose-prod.yml"
  ...
}
```

## Variables (`variables.tf` + `terraform.tfvars`)

| Variable | Default | Purpose |
|---|---|---|
| `project` | `gep-002` | Name prefix |
| `environment` | `demo` | Suffix |
| `location` | `West US` | Region |
| `dns_label` | `gep-002-demo` | Public IP `domain_name_label` |
| `vm_size` | `Standard_D2s_v5` | |
| `admin_username` | `azureuser` | |
| `admin_cidr_override` | `null` | Override auto-detected IP |
| `subscription_id` | `null` | Provider auth (env var preferred) |

`terraform.tfvars` ships with the defaults above so `terraform apply` works out of the box.

## Outputs (`outputs.tf`)

```hcl
output "ssh_command" {
  value = "ssh -i ${module.ssh_key.private_key_path} ${var.admin_username}@${module.network.fqdn}"
}
output "fqdn"            { value = module.network.fqdn }
output "public_ip"       { value = module.network.public_ip_address }
output "web_url"         { value = "http://${module.network.fqdn}:8080" }
output "admin_cidr_used" { value = local.admin_cidr }
output "private_key_path" {
  value     = module.ssh_key.private_key_path
  sensitive = true
}
```

The `ssh_command` output is the headline deliverable the user asked for.

## Files to be created

- [iac/main.tf](iac/main.tf), [iac/variables.tf](iac/variables.tf), [iac/outputs.tf](iac/outputs.tf), [iac/versions.tf](iac/versions.tf), [iac/terraform.tfvars](iac/terraform.tfvars), [iac/.gitignore](iac/.gitignore)
- [iac/modules/identity/](iac/modules/identity/) — `main.tf`, `variables.tf`, `outputs.tf`
- [iac/modules/ssh-key/](iac/modules/ssh-key/) — `main.tf`, `variables.tf`, `outputs.tf`
- [iac/modules/network/](iac/modules/network/) — `main.tf`, `variables.tf`, `outputs.tf`
- [iac/modules/compute/](iac/modules/compute/) — `main.tf`, `variables.tf`, `outputs.tf`, `cloud-init.yaml.tftpl`

## Files to be reused (read-only references)

- [docker-compose-prod.yml](docker-compose-prod.yml) — read at plan/apply time by the compute module via `file()` and injected into cloud-init's `write_files`.
- [gep-front-end/web/nginx.conf](gep-front-end/web/nginx.conf) — no change; already proxies `/iam/`, `/supplier/`, `/po/` so the SPA needs only the public 8080.

## Verification (post-apply)

1. `cd iac && terraform init && terraform apply` — confirm the displayed `ssh_command` and `web_url`.
2. From the operator machine: run the printed `ssh_command`; expect a login as `azureuser`.
3. On the VM: `sudo cloud-init status --wait` → `done`; `sudo docker compose -f /opt/gep/docker-compose.yml ps` → all services `Up`.
4. From a browser anywhere: open `http://gep-002-demo.westus.cloudapp.azure.com:8080` → SPA loads, login with `admin@demo.local / Passw0rd!`, exercise IAM/Supplier/PO flows (the SPA calls go through nginx → backends inside the VM).
5. From a non-operator network: `curl -m 5 http://<fqdn>:3001/health` → connection refused/timeout (NSG-blocked). From operator IP: same call returns 200.
6. From operator IP: `psql postgres://gep:gep@<fqdn>:5432/iam -c "select 1"` succeeds; from elsewhere it should time out.
7. `terraform output ssh_command` reprints the connect string at any time.
8. Confirm `iac/.secrets/id_ed25519` exists with Windows ACL granting only the current user (`icacls iac\.secrets\id_ed25519` shows a single ACE for `$env:USERNAME`).

## Known constraints / follow-ups (not in scope)

- JWT secret and DB passwords remain hardcoded in the compose file (called out in earlier analysis); promoting them to Key Vault is out of scope for this IaC pass.
- No HTTPS / TLS termination; SPA served on plain HTTP:8080. Adding a reverse-proxy with Let's Encrypt would be a follow-up.
- Operator IP is captured once at apply time; if the operator's IP changes, re-run `terraform apply` to refresh the NSG rule.
- Local Terraform state — single-operator only; switch to Azure Storage backend if multi-user is needed later.
