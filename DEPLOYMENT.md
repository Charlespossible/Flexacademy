# Deploying FlexAcademy to Railway

Three Railway services in one project, plus DNS at Truehost.

```
flexacademy.ng      → Railway service: frontend  (Vite build, served static)
api.flexacademy.ng  → Railway service: backend   (Express + Prisma)
                      Railway plugin:  PostgreSQL
                      Railway plugin:  Redis
```

Both apps live in one repo, so each service sets a **Root Directory**:

| Service  | Root Directory        |
|----------|-----------------------|
| backend  | `Backend`             |
| frontend | `Frontend/Frontend`   |

`railway.json` in each of those folders already defines the build and start
commands, so there is nothing to configure in the dashboard beyond variables
and the root directory.

---

## 1. Create the project

1. Railway → **New Project** → **Deploy from GitHub repo** → pick this repo.
2. On the created service, **Settings → Root Directory** → `Backend`. Rename it `backend`.
3. **+ New** → **Database** → **PostgreSQL**.
4. **+ New** → **Database** → **Redis**.
5. **+ New** → **GitHub Repo** (same repo) → Root Directory `Frontend/Frontend`. Rename it `frontend`.

## 2. Generate secrets

Locally:

```bash
cd Backend && node scripts/gen-secrets.mjs
```

Generate a **fresh** set — never reuse development values, and never paste them
into chat or commit them.

## 3. Backend variables

Set on the **backend** service. Use Railway's *variable reference* syntax for
the two database URLs so they track the plugins automatically.

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | *(leave unset — Railway injects it)* |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | from `gen-secrets.mjs` |
| `JWT_REFRESH_SECRET` | from `gen-secrets.mjs` (must differ) |
| `INTERNAL_API_KEY` | from `gen-secrets.mjs` |
| `CLIENT_URL` | `https://flexacademy.ng` |
| `FRONTEND_URL` | `https://flexacademy.ng` |
| `APP_URL` | `https://api.flexacademy.ng` |
| `ANTHROPIC_API_KEY` | your key |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` |
| `CLOUDINARY_CLOUD_NAME` | `dr2pczajq` |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
| `NOMBA_BASE_URL` | Nomba **live** base URL |
| `NOMBA_CLIENT_ID` / `NOMBA_CLIENT_SECRET` / `NOMBA_ACCOUNT_ID` | **live** credentials |
| `NOMBA_WEBHOOK_SECRET` | from Nomba dashboard |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://api.flexacademy.ng/api/v1/auth/google/callback` |
| `LOG_LEVEL` | `info` |
| `SEED_ADMIN_EMAIL` | `admin@flexacademy.ng` |
| `SEED_ADMIN_PASSWORD` | from `gen-secrets.mjs` — **store in a password manager** |

**Not needed in production:** `DATABASE_SHADOW_URL` (only used by
`prisma migrate dev` locally).

The server validates all of this at boot and **refuses to start** if anything
is missing, if a JWT secret is under 32 characters, if both secrets match, or
if the URLs are not `https`. A broken deploy fails immediately instead of
serving traffic.

## 4. Frontend variables

Vite reads env at **build** time, so this must be set before the first deploy
or the bundle will point at localhost.

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://api.flexacademy.ng/api/v1` |

## 5. Database — created and migrated automatically

The Postgres plugin creates the database. Schema is applied on every deploy by
the start command:

```
npx prisma migrate deploy && node dist/server.js
```

`migrate deploy` applies only committed migrations and never prompts or resets,
which is what makes it safe to run on every boot. All 13 migrations are
committed.

**Seed reference data once**, after the first successful deploy:

```bash
railway link                       # pick the project, then the backend service
railway run npm run prisma:seed
```

That inserts subjects and topics, and creates the super-admin from
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. With `NODE_ENV=production` it
**refuses to fall back to a default password** and skips the demo student
entirely.

## 6. Domain — Truehost stays the registrar

Registration remains at Truehost. Only DNS changes.

In Railway, **Settings → Networking → Custom Domain** on each service:
- frontend → `flexacademy.ng` and `www.flexacademy.ng`
- backend → `api.flexacademy.ng`

Railway shows a CNAME target per domain. Add at your DNS host:

| Record | Name | Value |
|---|---|---|
| CNAME | `www` | *(Railway target for frontend)* |
| CNAME | `api` | *(Railway target for backend)* |
| ALIAS/ANAME | `@` | *(Railway target for frontend)* |

Apex domains need ALIAS/ANAME (or CNAME flattening). Truehost's panel may not
support that — which is the practical reason to move nameservers to
**Cloudflare** (free): it flattens CNAMEs at the apex, propagates in minutes,
and adds CDN caching that matters on Nigerian connections.

Railway issues TLS automatically once DNS resolves.

## 7. Ongoing updates

Push to your default branch and Railway rebuilds and redeploys both services.
Nothing else to do.

**When a change includes a schema migration:** commit the generated folder
under `Backend/prisma/migrations/`. `migrate deploy` picks it up on the next
boot. Never run `prisma migrate dev` against production.

## 8. After the first deploy — check these

```bash
curl https://api.flexacademy.ng/health
```

- [ ] Health returns `{"status":"OK"}`
- [ ] Deploy logs show `✅ Environment validated (production)`
- [ ] Deploy logs show `Pricing config loaded and validated`
- [ ] `https://flexacademy.ng` loads and can log in
- [ ] Nomba webhook URL registered: `https://api.flexacademy.ng/api/v1/payments/webhook`
- [ ] Google OAuth redirect URI added in Google Cloud Console
- [ ] Super-admin login works; **change the seeded password**

---

## Known gaps before taking real payments

- **No idempotency keys.** Nomba retries webhooks; concurrent retries can both
  activate a subscription. Fix before going live.
- **`Payment` stores only `amount`** — no `gross/vat/fee/net`, so revenue
  recognition and tutor payouts cannot be computed.
- Money is `Decimal` naira, not integer kobo.
