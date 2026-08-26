# Deploying FlexAcademy to Railway

Follow these in order. Do not skip ahead — most failed deploys are a step done
out of sequence.

**End state:** four things in one Railway project.

```
backend    Express + Prisma      ->  api.flexacademy.ng
frontend   Vite static build     ->  flexacademy.ng
Postgres   Railway plugin
Redis      Railway plugin
```

Both apps live in one repo, so each service points at its own folder.

---

## STEP 1 — Push the code

Railway deploys from GitHub. Nothing is uploaded by hand.

```bash
cd c:/Users/dell/Desktop/MyProjects/Flexacademy
git status --porcelain          # confirm no .env appears
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

Both `.env` files are gitignored and have never been committed. Verified.

---

## STEP 2 — Generate your secrets

```bash
cd Backend
node scripts/gen-secrets.mjs
```

Copy the output somewhere safe (password manager). You need it in Step 5.
Generate a fresh set — never reuse development values.

---

## STEP 3 — Create the backend service

1. Railway -> **New Project** -> **Deploy from GitHub repo**
2. Pick `Charlespossible/Flexacademy`. If it is not listed, click
   **Configure GitHub App** and grant access.
3. **The first build will fail.** That is expected — Railway does not yet know
   the backend lives in a subfolder.
4. Open the service -> **Settings**
   - **Root Directory** -> `Backend`   <- this is the one that matters
   - **Service Name** -> `backend`     <- cosmetic, but keeps things clear

Do not set build or start commands. `Backend/railway.json` supplies them.

---

## STEP 4 — Add the databases

In the same project:

- **+ New** -> **Database** -> **PostgreSQL**
- **+ New** -> **Database** -> **Redis**

Nothing to configure inside them. Note the exact name shown on each card —
you need it in the next step.

---

## STEP 5 — Backend variables

**backend service -> Variables -> Raw Editor.** Paste everything at once.
Setting them one at a time causes a failed deploy per missing variable.

```
NODE_ENV=production

DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

JWT_SECRET=<from Step 2>
JWT_REFRESH_SECRET=<from Step 2>
INTERNAL_API_KEY=<from Step 2>
SEED_ADMIN_EMAIL=admin@flexacademy.ng
SEED_ADMIN_PASSWORD=<from Step 2>

CLIENT_URL=https://flexacademy.ng
FRONTEND_URL=https://flexacademy.ng
APP_URL=https://api.flexacademy.ng

ANTHROPIC_API_KEY=<your key>
ANTHROPIC_MODEL=claude-sonnet-5

CLOUDINARY_CLOUD_NAME=dr2pczajq
CLOUDINARY_API_KEY=<from Cloudinary>
CLOUDINARY_API_SECRET=<from Cloudinary>

LOG_LEVEL=info
```

**Do not set `PORT`.** Railway injects it.

**`${{Postgres.DATABASE_URL}}`** is a live reference, not a literal. Replace
`Postgres` with your database service's actual name from Step 4. Type `${{`
in the value field and use the autocomplete rather than typing it by hand.

After saving, reveal the resolved value of `DATABASE_URL`. It must show a real
`postgresql://...` string. If it shows the literal `${{...}}`, the service name
is wrong — fix it before deploying.

**Not needed:** `DATABASE_SHADOW_URL` (local `migrate dev` only), and the
`NOMBA_*` block until you have live credentials. The app boots without payment
keys and logs a warning; checkout is the only thing that will not work.

---

## STEP 6 — Seed the database, once

The schema is applied automatically on every deploy. Reference data
(subjects, topics) and your admin account need one manual run.

**backend service -> Settings -> Deploy -> Custom Start Command:**

```
npx prisma migrate deploy && npm run prisma:seed && node dist/server.js
```

Redeploy. Watch the logs for:

```
8 subjects seeded
Admin seeded: admin@flexacademy.ng (password from SEED_ADMIN_PASSWORD)
Demo student skipped (production)
FlexAcademy API running on port 8080 [production]
```

**Then clear the Custom Start Command** so `railway.json` takes over again.
The seed is idempotent, but leaving it slows every boot.

---

## STEP 7 — Create the frontend service

1. **+ New** -> **GitHub Repo** -> same repo
2. **Settings -> Root Directory** -> `Frontend/Frontend`
3. **Settings -> Service Name** -> `frontend`
4. **Variables:**

```
VITE_API_URL=https://api.flexacademy.ng/api/v1
```

**Set this before the first successful build.** Vite bakes env values into the
bundle at build time. If it builds without it, the live site calls localhost
and nothing works until you redeploy.

---

## STEP 8 — Domain

Registration stays at Truehost. Only DNS changes.

In Railway, **Settings -> Networking -> Custom Domain**:
- frontend -> `flexacademy.ng` and `www.flexacademy.ng`
- backend -> `api.flexacademy.ng`

Railway shows a CNAME target for each. Add at your DNS host:

| Type        | Name  | Value                     |
|-------------|-------|---------------------------|
| CNAME       | `api` | Railway target (backend)  |
| CNAME       | `www` | Railway target (frontend) |
| ALIAS/ANAME | `@`   | Railway target (frontend) |

Apex domains need ALIAS/ANAME, which Truehost's panel may not support. If so,
move nameservers to **Cloudflare** (free) — it flattens CNAMEs at the apex,
propagates in minutes, and adds CDN caching that helps on Nigerian networks.
Registration still stays at Truehost.

TLS is issued automatically once DNS resolves.

---

## STEP 9 — Verify

```bash
curl https://api.flexacademy.ng/health
```

- [ ] Returns `{"status":"OK"}`
- [ ] Logs show `Environment validated (production)`
- [ ] Logs show `Pricing config loaded and validated`
- [ ] `https://flexacademy.ng` loads
- [ ] You can log in as `admin@flexacademy.ng`
- [ ] Change the seeded admin password

---

## Ongoing updates

```bash
git push origin main
```

Both services rebuild and redeploy. Schema migrations apply automatically on
boot, as long as the migration folder is committed under
`Backend/prisma/migrations/`.

Never run `prisma migrate dev` against production.

Optional once stable: **Settings -> Watch Paths** — `Backend/**` on the backend
and `Frontend/Frontend/**` on the frontend, so each only rebuilds when its own
code changes.

---

## If a deploy fails

Read **Deploy Logs**, not Build Logs. The app refuses to boot on a bad config
and prints exactly what is wrong.

| Log message | Cause |
|---|---|
| `Environment variable not found: DATABASE_URL` | Step 5 not done, or wrong service name in the reference |
| `Environment is not deployable: ... is missing` | A required variable is unset |
| `JWT_SECRET is too short` | Use the Step 2 generator |
| `SEED_ADMIN_PASSWORD must be set` | Set it before using the Step 6 start command |
| Build fails, no `package.json` | Root Directory not set (Step 3) |

---

## Known gaps before taking real money

- **No idempotency keys.** Nomba retries webhooks; concurrent retries can both
  activate a subscription.
- **`Payment` stores only `amount`** — no `gross/vat/fee/net`, so revenue
  recognition and tutor payouts cannot be computed.
- Money is `Decimal` naira, not integer kobo.

Launch without payments if you like — the app runs fine and warns in the logs.
