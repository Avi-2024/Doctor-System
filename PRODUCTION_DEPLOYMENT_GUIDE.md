# Production Deployment Guide (Step-by-Step)

## 1) Environment Variable Structure

### Step 1.1 — Create environment files per stage
- Create separate files and secret stores for:
  - `.env.development`
  - `.env.staging`
  - `.env.production`
- Never commit real secrets in Git.
- Keep only `.env.example` in repo with placeholder values.

### Step 1.2 — Group variables by domain
Use consistent prefixes so operations are clear:

- **App/Core**
  - `NODE_ENV=production`
  - `PORT=8080`
  - `APP_NAME=doctor-system`
  - `API_BASE_URL=https://api.yourdomain.com`

- **MongoDB**
  - `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`
  - `MONGODB_DB_NAME=doctor_system_prod`

- **JWT/Auth**
  - `JWT_ACCESS_SECRET=<64+ char random secret>`
  - `JWT_REFRESH_SECRET=<different 64+ char random secret>`
  - `JWT_ACCESS_EXPIRES_IN=15m`
  - `JWT_REFRESH_EXPIRES_IN=7d`

- **WhatsApp Business API**
  - `WHATSAPP_API_BASE_URL=https://graph.facebook.com/v21.0`
  - `WHATSAPP_PHONE_NUMBER_ID=<phone_number_id>`
  - `WHATSAPP_BUSINESS_ACCOUNT_ID=<waba_id>`
  - `WHATSAPP_ACCESS_TOKEN=<long_lived_token>`
  - `WHATSAPP_WEBHOOK_VERIFY_TOKEN=<verify_token>`

- **Security/Ops**
  - `CORS_ALLOWED_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com`
  - `RATE_LIMIT_WINDOW_MS=900000`
  - `RATE_LIMIT_MAX=300`
  - `LOG_LEVEL=info`

### Step 1.3 — Add runtime validation
- Validate env vars at startup.
- Fail fast if critical values are missing (DB URI, JWT secrets, WhatsApp token).

### Step 1.4 — Secret management
- Store production secrets in managed secret services (AWS Secrets Manager / GCP Secret Manager / Azure Key Vault / Vault).
- Rotate secrets periodically.
- Restrict secret access using least privilege IAM.

---

## 2) MongoDB Atlas Configuration

### Step 2.1 — Create Atlas project and cluster
- Create separate Atlas projects (or at minimum separate clusters) for staging and production.
- Prefer dedicated/shared tier suitable for expected load.

### Step 2.2 — Enable secure network access
- Whitelist only deployment egress IPs.
- Avoid `0.0.0.0/0` in production.
- Use VPC peering/private endpoint if available.

### Step 2.3 — Create least-privilege DB user
- Create app user with only required database permissions.
- Use strong generated password.

### Step 2.4 — Configure connection options
- Use SRV connection string with TLS enabled.
- Keep `retryWrites=true&w=majority`.
- Set app-level DB timeouts and pool sizing as needed.

### Step 2.5 — Backup and recovery
- Enable continuous backups / snapshots.
- Define restore playbook (RTO/RPO targets).
- Test restore on staging at regular intervals.

### Step 2.6 — Monitoring and alerting
- Enable Atlas alerts for:
  - high CPU
  - storage thresholds
  - connection spikes
  - replication lag
- Route alerts to on-call channels.

---

## 3) JWT Security Tips

### Step 3.1 — Use separate secrets
- Access and refresh tokens must use different secrets.
- Secrets must be long, random, and stored in secret manager.

### Step 3.2 — Keep access tokens short-lived
- Recommended: 10–20 minutes for access token.
- Keep refresh token longer but controlled (e.g., 7 days).

### Step 3.3 — Rotate refresh tokens
- Rotate refresh token on each refresh.
- Revoke old token immediately after issuing new one.

### Step 3.4 — Include minimal claims
- Keep payload minimal: `sub`, `clinicId`, `role`, `iat`, `exp`.
- Never store sensitive PII in JWT payload.

### Step 3.5 — Harden transport and storage
- HTTPS only.
- If using cookies: set `HttpOnly`, `Secure`, `SameSite=Strict/Lax`.
- If using headers: protect against XSS and token leakage.

### Step 3.6 — Add revocation and incident controls
- Maintain token/session blacklist strategy for forced logout.
- Support emergency secret rotation procedure.

---

## 4) WhatsApp API Environment Setup

### Step 4.1 — Provision WhatsApp Business assets per clinic mapping
- Each clinic should have mapped WhatsApp number in your DB (`contact.whatsappNumber`).
- Maintain `phone_number_id` to clinic mapping in secure config/service.

### Step 4.2 — Configure webhook endpoint
- Set webhook URL to production endpoint:
  - `POST /api/v1/whatsapp/webhook`
- Set verify token from env (`WHATSAPP_WEBHOOK_VERIFY_TOKEN`).

### Step 4.3 — Configure required tokens/IDs
- Store `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` in secret manager.
- Use long-lived token policy and renewal schedule.

### Step 4.4 — Template and messaging readiness
- Pre-approve templates for:
  - appointment confirmation
  - reminder
  - fallback/invalid format
- Keep template names/versioning documented.

### Step 4.5 — Reliability and observability
- Log webhook request IDs and response outcomes.
- Add retries/backoff for outbound send failures.
- Monitor delivery/read/failure status from provider callbacks.

---

## 5) Deployment Checklist (Production)

### Step 5.1 — Pre-deployment checks
- Confirm env vars are complete and validated.
- Confirm DB migrations/indexes are ready.
- Run lint/tests/security scan.
- Confirm CORS allowlist and rate limits are configured.

### Step 5.2 — Build and release process
- Build immutable artifact/container image.
- Tag release version (`vX.Y.Z`).
- Deploy to staging first and run smoke tests.

### Step 5.3 — Production rollout
- Deploy via rolling/blue-green strategy.
- Run health checks (`/health`) and critical API smoke tests.
- Verify auth, appointment booking, billing, and WhatsApp webhook paths.

### Step 5.4 — Post-deployment validation
- Validate logs, error rates, p95 latency, DB metrics.
- Verify scheduled jobs/queues are processing.
- Verify notifications and webhook processing are successful.

### Step 5.5 — Security hardening
- Enforce HTTPS and HSTS.
- Ensure no secrets printed in logs.
- Confirm least-privilege IAM on infra + DB + secrets.

### Step 5.6 — Operational readiness
- Set dashboards (API, DB, queue, webhook success rate).
- Set alerts and escalation policy.
- Document rollback steps and execute rollback drill.

### Step 5.7 — Go-live signoff
- Product signoff
- Engineering signoff
- Security signoff
- Support/on-call readiness signoff
