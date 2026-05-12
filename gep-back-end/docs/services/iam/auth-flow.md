# IAM — Authentication Flow

## Login → token issuance

```mermaid
sequenceDiagram
    actor Client
    participant IAM as iam :3001
    participant DB as Postgres (auth)

    Client->>IAM: POST /api/v1/auth/login { email, password }
    IAM->>DB: SELECT * FROM users WHERE email = $1
    DB-->>IAM: user row (or none)
    IAM->>IAM: bcrypt.compare(password, password_hash)
    alt valid
        IAM->>IAM: sign HS256 JWT (iss, sub, roles, approval_limit, exp=+24h)
        IAM-->>Client: 200 { access_token, token_type, expires_in, user }
    else invalid
        IAM-->>Client: 401 AUTH_FAILED
    end
```

## Subsequent calls (token validation by downstream services)

```mermaid
sequenceDiagram
    actor Client
    participant SUP as supplier-service / po-service
    Client->>SUP: GET /resource (Authorization: Bearer <jwt>)
    SUP->>SUP: jwt.verify(token, JWT_SECRET, { iss, aud })
    alt valid
        SUP-->>Client: 200 ...
    else expired / bad sig / wrong iss
        SUP-->>Client: 401 UNAUTHORIZED
    end
```

The downstream services trust the JWT's claims (`roles`, `approval_limit`) directly — they do **not** call back to `iam` to re-fetch the user.

## Claim shape

```json
{
  "iss": "gep-auth",
  "sub": "<user uuid>",
  "email": "buyer@demo.local",
  "roles": ["BUYER"],
  "approval_limit": null,
  "iat": 1700000000,
  "exp": 1700086400
}
```

`aud` is set per-consumer (`gep-supplier`, `gep-po`) — see `docker-compose.yml`.
