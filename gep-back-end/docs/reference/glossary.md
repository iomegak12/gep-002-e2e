# Glossary

| Term | Meaning |
|---|---|
| **SCM** | Supply Chain Management — the domain this platform automates. |
| **PO** | Purchase Order — a buyer's commitment to a supplier, with line items, totals and an approval lifecycle. |
| **Buyer** | User role: creates POs. |
| **Approver** | User role: signs off on POs up to their `approval_limit`. |
| **Admin** | User role: manages users, roles, supplier lifecycle. |
| **IAM** | Identity & Access Management — the service that authenticates users and issues JWTs. |
| **JWT** | JSON Web Token. HS256-signed, 24h, no refresh. |
| **`iss`** | JWT issuer claim — always `gep-auth`. |
| **`aud`** | JWT audience claim — `gep-supplier` or `gep-po`. |
| **`sub`** | JWT subject — the user's UUID. |
| **Approval limit** | Per-user numeric cap; an approver may approve POs whose total is ≤ this value. |
| **Approval threshold** | Per-environment cap (`DEFAULT_APPROVAL_THRESHOLD`); POs at or below it are auto-approved on submit. |
| **Lifecycle / state machine** | The set of allowed status transitions for a resource (PO, Supplier). |
| **`supplier_snapshot`** | JSON blob on a PO that captures the supplier's identifying fields at submission time, so historical POs are stable against supplier edits. |
| **Aggregations** | Pre-baked spend / count rollups for dashboards (by category, supplier, status). |
| **Correlation ID** | Per-request UUID echoed in responses (`X-Correlation-Id`); used to stitch logs across services. |
| **Soft delete** | Resource is hidden via `deleted_at` rather than removed from the DB. Used by suppliers. |
| **Seed** | One-shot container that populates demo users/suppliers/POs through the services' HTTP APIs. |
