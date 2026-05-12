# Supplier — Data Model

Source: `supplier-service/app/models.py`. MongoDB collection: `suppliers` (database: `suppliers`).

```mermaid
classDiagram
    class Supplier {
      string id
      string supplier_code
      string legal_name
      string display_name
      Category category
      string sub_category
      string country
      string region
      string tax_id
      Contact contact
      Address address
      PaymentTerms payment_terms
      string currency
      Status status
      string blacklist_reason
      Certification[] certifications
      string[] tags
      float rating
      float on_time_delivery_rate
      int total_orders_count
      float total_spend_inr
      string created_by
      datetime created_at
      datetime updated_at
      datetime deleted_at
    }
    class Contact {
      string primary_name
      EmailStr email
      string phone
    }
    class Address {
      string street
      string city
      string state
      string country
      string postal_code
    }
    class Certification {
      string name
      string issued_by
      string valid_until
    }
    Supplier *-- Contact
    Supplier *-- Address
    Supplier "1" o-- "*" Certification
```

## Enums

- **`Category`** — `RAW_MATERIALS`, `PACKAGING`, `LOGISTICS`, `IT_SERVICES`, `PROFESSIONAL_SERVICES`, `MRO`, `CAPEX`, `OTHER`.
- **`PaymentTerms`** — `NET_15`, `NET_30`, `NET_45`, `NET_60`, `NET_90`, `IMMEDIATE`, `ADVANCE_50_50`.
- **`Status`** — `PENDING_APPROVAL`, `ACTIVE`, `INACTIVE`, `BLACKLISTED`.

## Notes

- `supplier_code` is the human-readable unique key; `id` is a UUID string.
- `deleted_at` provides soft-delete; read endpoints filter it out unless explicitly requested.
- KPI fields (`rating`, `on_time_delivery_rate`, `total_orders_count`, `total_spend_inr`) are denormalised here for fast list views; they are updated by background jobs / explicit endpoints, not by `po-service`.
