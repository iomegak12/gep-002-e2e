# User Journeys

Three end-to-end journeys exercise every service in the platform.

## 1. Supplier onboarding (Admin)

```mermaid
sequenceDiagram
    actor Admin
    participant IAM as iam :3001
    participant SUP as supplier-service :3002

    Admin->>IAM: POST /auth/login (admin@demo.local)
    IAM-->>Admin: access_token (24h)
    Admin->>SUP: POST /suppliers { name, category, ... }
    SUP-->>Admin: 201 supplier (status=PENDING_APPROVAL)
    Admin->>SUP: POST /suppliers/{id}/activate
    SUP-->>Admin: 200 supplier (status=ACTIVE)
```

## 2. Create & submit a purchase order (Buyer)

```mermaid
sequenceDiagram
    actor Buyer
    participant IAM as iam :3001
    participant PO as po-service :3003
    participant SUP as supplier-service :3002

    Buyer->>IAM: POST /auth/login (buyer@demo.local)
    IAM-->>Buyer: access_token
    Buyer->>SUP: GET /suppliers?status=ACTIVE
    SUP-->>Buyer: list of suppliers
    Buyer->>PO: POST /purchase-orders (draft)
    PO->>SUP: GET /suppliers/{id}   %% validate supplier is ACTIVE
    SUP-->>PO: supplier
    PO-->>Buyer: 201 PO (status=DRAFT)
    Buyer->>PO: POST /purchase-orders/{id}/submit
    PO-->>Buyer: 200 PO (status=SUBMITTED, awaits approver)
```

## 3. Approve a PO and view spend (Approver / Admin)

```mermaid
sequenceDiagram
    actor Approver
    participant PO as po-service :3003

    Approver->>PO: GET /purchase-orders?status=SUBMITTED
    PO-->>Approver: queue of POs within approval_limit
    Approver->>PO: POST /purchase-orders/{id}/approve
    PO-->>Approver: 200 PO (status=APPROVED)

    Note over Approver,PO: Later — spend analytics
    Approver->>PO: GET /purchase-orders/aggregations/spend-by-category?period=ytd
    PO-->>Approver: { category: total } map
```

A PO whose total exceeds the approver's `approval_limit` cannot be approved by them (403); routing is based on the threshold configured per user in `iam`.
