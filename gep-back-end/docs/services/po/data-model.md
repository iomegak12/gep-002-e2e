# PO — Data Model

Source: `po-service/prisma/schema.prisma`

```mermaid
erDiagram
    PURCHASE_ORDERS ||--o{ PO_LINE_ITEMS : has
    PURCHASE_ORDERS {
        UUID         id PK
        VARCHAR_20   po_number "UNIQUE"
        UUID         supplier_id "FK to supplier-service (logical)"
        JSON         supplier_snapshot
        UUID         buyer_id "FK to iam.users (logical)"
        UUID         approver_id "nullable"
        VARCHAR_20   status
        CHAR_3       currency
        DECIMAL      subtotal
        DECIMAL      tax_amount
        DECIMAL      total_amount
        DATE         expected_delivery_date
        DATE         actual_delivery_date
        JSON         delivery_address
        VARCHAR_20   payment_terms
        TEXT         notes
        TEXT         rejection_reason
        BOOLEAN      requires_approval
        DECIMAL      approval_threshold
        TIMESTAMPTZ  created_at
        TIMESTAMPTZ  submitted_at
        TIMESTAMPTZ  approved_at
        TIMESTAMPTZ  fulfilled_at
        TIMESTAMPTZ  closed_at
        TIMESTAMPTZ  updated_at
    }
    PO_LINE_ITEMS {
        UUID     id PK
        UUID     po_id FK
        INT      line_number
        VARCHAR  item_description
        VARCHAR  sku
        DECIMAL  quantity
        VARCHAR  unit_of_measure
        DECIMAL  unit_price
        DECIMAL  tax_rate
        DECIMAL  line_total
        TEXT     notes
    }
    PO_NUMBER_SEQ {
        INT year PK
        INT last_value
    }
```

## Notes

- **Foreign keys to other services are logical only** — `supplier_id` (Mongo) and `buyer_id` / `approver_id` (Postgres in `auth` DB) are not enforced by Postgres. Integrity comes from validation at write time.
- **`supplier_snapshot`** freezes the supplier's identifying fields at submission, so renaming a supplier later doesn't change historical PO text.
- **Indexes** — `status`, `supplier_id`, `buyer_id`, `created_at`. Tuned for the dashboard "my POs" and "approvals queue" views.
- **`PoNumberSeq`** — one row per year, used by an upsert-with-increment to mint `PO-YYYY-NNNNNN` numbers safely.
- **Cascade delete** — deleting a `PurchaseOrder` cascades to its line items (`onDelete: Cascade`). v1 only soft-uses this for test cleanup.

## Generating the ER diagram from Prisma

For an always-up-to-date ER, add `prisma-erd-generator` to the schema as a `generator` block; output can be embedded back into this page via the snippet extension. Out of scope for the initial doc-gen pass.
