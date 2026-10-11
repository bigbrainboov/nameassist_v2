# Backend development

The backend uses Django REST Framework, PostgreSQL, and Redis for Celery.

## Run this repository locally

From `backend/`, start the API and its supporting services, then apply migrations:

```sh
docker compose up --build -d
docker compose exec web python manage.py migrate
docker compose exec web python manage.py check
```

From `nameassist/`, start the frontend:

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` requests to Django on port 8000.
Compose uses local Django settings and email preview mode; email and payment
callbacks use the frontend on port 5173. Google sign-in remains hidden until
`VITE_GOOGLE_OAUTH_CLIENT_ID` is configured in the frontend and the matching
`GOOGLE_OAUTH_CLIENT_ID` is configured in the backend.

Check the API and database/Redis connection at http://localhost:8000/api/v1/health/.
API documentation is at http://localhost:8000/api/v1/schema/docs/.

Run backend tests with `docker compose exec web python manage.py test --noinput`.

## Admin security

Admin UI work is separate. The security foundation is enforced by the backend:

- Customer signup cannot set roles or staff/superuser flags.
- `POST /api/v1/admin/auth/login/` requires `email`, `password`, and a six-digit
  authenticator `otp`. Staff accounts are denied until staff permissions are defined.
- Operations APIs under `/api/v1/admin/` require an active admin and an MFA-authenticated
  session. Customer login cannot grant operations access.
- Login limits are shared across both login routes: 10 attempts per normalized email
  and 300 per network peer in a 15-minute window, persisted in PostgreSQL.
  The peer limit is deliberately generous because Render uses a reverse proxy;
  client-supplied forwarding headers are not trusted.
- Customer application, document, and payment APIs only return owned records.
  Document downloads are authorized before generating a five-minute signed R2 URL;
  keep the R2 bucket private and disable public access in Cloudflare.
- Admin status changes and document/payment metadata edits write an audit record
  atomically. Audit APIs are read-only. Future write endpoints must use this same
  transactional audit helper, including future file upload/delete operations.
- Logout revokes the session's access and refresh tokens. Deactivation, role,
  password, and MFA changes invalidate existing sessions through model saves
  and bulk queryset updates. Raw SQL changes are outside these application hooks.
- Admin access tokens last five minutes; the session expires after eight hours.
  Customer sessions expire after seven days. Refresh rotation cannot extend these limits.
- The unused built-in Django `/admin/` route is disabled so it cannot bypass MFA.

Provision admins from a trusted terminal in the same environment as the API:

```sh
python manage.py migrate
python manage.py createsuperuser
python manage.py enroll_admin_mfa admin@example.com
```

Set `MFA_ENCRYPTION_KEY` to a persistent random secret of at least 32 characters.
The Render Blueprint generates it automatically. For local enrollment, add a
separate random value to `backend/.env`. Never commit it or expose it to the frontend.
Add the displayed secret to an authenticator app and enter its code to confirm.
Enrollment consumes that code, so use the next code to log in. Re-enroll with
`--reset` from the trusted terminal if an authenticator is lost; this also revokes sessions.
Changing the encryption key requires re-enrolling admins.

Free Render instances do not have a server shell. Provision against the production
database from a trusted local terminal with production settings and the same
`MFA_ENCRYPTION_KEY`; do not put either secret in command arguments or commit them.

Deploying this change invalidates legacy tokens without a server-side session.
Existing users must log in again. The admin frontend uses a separate MFA-authenticated session.

Run the security suite without external services:

```sh
SECRET_KEY=local-tests-only DEBUG=False DATABASE_URL=sqlite:////tmp/nameassist-tests.sqlite3 python manage.py test --noinput
```

## Docker basics for this project

Install [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/),
open it, and complete its first-run setup. Keep Docker Desktop running while
working with containers. It includes Docker Compose.

- An **image** is the packaged software used to create a container. Here we use
  `postgres:15-alpine` and `redis:7-alpine`.
- A **container** is a running instance of an image. PostgreSQL and Redis each
  run in their own container.
- **Compose** reads `docker-compose.yml` to configure and start those services.
- A **port mapping**, such as `5432:5432`, connects a port on your Mac (left)
  to a port in the container (right).
- The **volume** `postgres_data` keeps database files outside the container,
  so recreating the container preserves your database.

For the local Django workflow, requests follow this path:

```text
Django in your Mac's virtual environment
  ├─ 127.0.0.1:5432 → PostgreSQL container (db)
  └─ 127.0.0.1:6380 → Redis container (redis)
```

Run these from `backend/`:

| Command | Purpose |
| --- | --- |
| `docker compose up -d db redis` | Create/start the two services in the background |
| `docker compose ps` | Show container status and published ports |
| `docker compose logs --tail=50 db redis` | Read recent service logs |
| `docker compose exec db psql -U user -d nameassist` | Open PostgreSQL's shell; use `\q` to exit |
| `docker compose exec redis redis-cli ping` | Check Redis; expect `PONG` |
| `docker compose stop db redis` | Stop the services while keeping containers and data |
| `docker compose down` | Remove project containers/network, keeping the database volume |

Avoid `docker compose down -v` unless you intend to delete the database volume.
Redis uses host port 6380 to avoid conflicting with a native Redis service on
port 6379; inside Docker it still listens on port 6379.
Starting only `db redis` does not build the Django image or start the `web` and
`celery_worker` services.

## Run Django locally

Run these commands from `backend/`. Docker Compose must be installed and its
engine running to start the supporting services.

1. Create `.env` from `.env.example` if you do not already have one. Preserve
   any existing credentials.
2. Start PostgreSQL and Redis:

   ```sh
   docker compose up -d db redis
   ```

3. Activate your Python environment with the project dependencies installed,
   then run:

   ```sh
   source venv/bin/activate
   python manage.py migrate
   python manage.py runserver
   ```

The local `.env` uses `127.0.0.1:5432` for PostgreSQL and `127.0.0.1:6380`
for Redis, matching the ports published by Compose. If you run these services
without Docker, configure `DATABASE_URL` and `REDIS_URL` for those installations,
including the correct database credentials.

## Run everything in Docker

```sh
docker compose up --build -d
docker compose exec web python manage.py migrate
```

Compose sets `DATABASE_URL` and `REDIS_URL` explicitly for the web and Celery
containers, using the internal service names `db` and `redis`.

If a local `runserver` or `migrate` command reports `failed to resolve host 'db'`,
check that `.env` uses the local addresses above. Also check for exported
`DATABASE_URL` or `REDIS_URL` variables in your shell: they take precedence over
`.env`. A subsequent `connection refused` error means the service is not
reachable at the configured address; start it and verify its port.

## Live Change of Name intake

Run `python manage.py migrate` before using the new form. Both customer dashboard
application buttons open the service picker. Change of Name currently accepts
former/new names, contact details, a required sworn affidavit and optional NIN,
BVN/bank, passport, driver's license, education and work documents. Middle names
are optional. Uploads support PDF/JPEG/PNG, up to 10 MB each and 10 files total.

- `GET /api/v1/applications/options/`: enabled newspapers, service availability and upload limits.
- `POST /api/v1/applications/change-of-name/`: authenticated multipart submission.
  Send a UUID `submission_id`, name/contact fields, `newspaper` slug, one `affidavit`
  file and zero or more files under `nin`, `bvn_bank`, `passport`, `drivers_license`,
  `education`, and `work`. Retrying with the same customer and submission ID returns
  the original application. The server sets ownership, reference and initial status.
- Existing application reads include name details, newspaper snapshot and history.
- `GET /api/v1/documents/{id}/content/`: authorized file attachment download. The
  customer dashboard uses this authenticated endpoint for both local and R2 files.

Local settings use `backend/private_uploads/` (git-ignored) when no R2 bucket is
configured. There is no public media route. Production continues to require private
Cloudflare R2 storage and its environment variables; local disk is not a production fallback.
The form saves records and files before offering Paystack checkout. The saved service
fee is verified by the backend before the application can advance into document review.
Automatic newspaper publication is not performed. See [Paystack setup and security
notes](../docs/payments/paystack.md) for environment variables, callbacks and webhook setup.

### Newspaper availability

The initial catalog contains Punch, Vanguard, The Guardian and The Nation. This is
NameAssist's configurable selection catalog, not a live connection to publishers or
a guarantee of publication slots. Confirm operational availability before release.
Use a trusted terminal connected to the relevant environment:

```sh
python manage.py newspaper_catalog
python manage.py newspaper_catalog punch --unavailable
python manage.py newspaper_catalog punch --available
python manage.py newspaper_catalog another-paper --name 'Another Paper' --logo-url '/assets/newspapers/another-paper.png' --available
```

Newspaper logos are local frontend assets, with publisher sources recorded in
`nameassist/public/assets/newspapers/SOURCES.md`. New papers need a matching logo
asset (or an HTTPS logo URL). Prices are intentionally omitted from the picker.

### Customer document management and R2 layout

The current setup uses **one private production R2 bucket**, also used during development.
New files use server-generated keys:

```text
users/<owner-uuid>/applications/<application-uuid>/uploads/<random-uuid>.pdf
users/<owner-uuid>/applications/<application-uuid>/deliverables/<random-uuid>.pdf
```

These prefixes organise storage; API ownership checks enforce access. Existing files
keep their stored keys and remain readable without moving them. Replacement files get
fresh keys. Original filenames are stored in the database for display, not in object keys.

Run `python manage.py migrate` before running the updated API. Customers can manage
their uploads from My Documents or application details while a Change of Name application
is still `received`. Starting document review locks customer edits, including uploads.
An affidavit can only be replaced, not deleted or added a second time. Admin uploads
and deliverables are read-only to customers. The limits remain PDF/JPEG/PNG, 10 MB per
file, and 10 uploaded files per application. A grouped preview has separate actions
for each attachment; removing one does not remove other copies.

- `POST /api/v1/documents/`: multipart `application` UUID, `doc_type`, and one `file`.
- `POST /api/v1/documents/{id}/replace/`: multipart `file` and the document's `updated_at`.
- `DELETE /api/v1/documents/{id}/`: JSON `{"updated_at": "<timestamp from document API>"}`.
- Reads include `original_filename`, `updated_at`, `can_replace`, and `can_delete`.
  Application reads include `can_manage_documents`.

The backend checks ownership and stage under database locks; stale versions return
409. Upload, replacement, and deletion create audit records in the same transaction.
Replacement saves the new file before switching the record. Old files are queued for
deletion only after the change commits. Failed deletion jobs persist in the database
and are retried after subsequent document mutations. To retry without customer traffic:

```sh
python manage.py cleanup_document_files --limit 100
```

The command can be run periodically using an existing scheduler; no additional paid
service is required. A removed attachment is immediately unavailable through the API,
but physical deletion can be delayed while storage is unavailable. Automated tests
override storage with temporary local files and do not touch the production bucket.

### Duplicate document previews

The customer Documents page groups exact file contents into one preview and shows
all application references using that file. Different contents remain separate;
files and per-application records are preserved. New uploads receive a SHA-256
fingerprint automatically. After migrating an existing deployment, run:

```sh
python manage.py fingerprint_documents
```

This command is safe to rerun. Unreadable files are reported and left ungrouped.
Grouping uses content identity, so separate scans or modified versions of the same
paper document remain separate. Uploaded files and deliverables are grouped separately.

### Live admin application workspace

Open the frontend at `/#/admin/login` and sign in with an enrolled admin account,
password, and current authenticator code. The overview and Applications pages use
live API records. Customer sessions and admin sessions are stored separately; demo
officer selection is not used by the live routes.

The application queue requests `GET /api/v1/admin/applications/?payment_status=paid`.
The backend includes only verified successful payments in the configured Paystack
test/live environment. Pending, failed and unverified success records are excluded.
A second successful payment does not duplicate its application in the queue.
Admins retain access to the unfiltered operations API for support investigations.

The queue loads on entry and refreshes on explicit Refresh or after an admin saves a change.
There is no timer-based or window-focus polling.
Application details show applicant names/contact data, selected newspaper, payment
reference, uploaded document previews/downloads and history. Status changes are
persisted through the audited status endpoint and become visible to the customer.
Completion still requires a deliverable document on the backend.

This frontend increment connects Overview and Applications. The former demo-only
Customers, Documents, Payments, manual intake and officer-assignment screens are
not exposed by the live workspace; document viewing is available inside each
application. No new database migration is needed for the admin UI.

The live admin workspace retains the original registry sidebar, header, overview
cards, pipeline, docket table and sign-in styling. Display values are mapped from
API records; unsupported demo data and officer switching are not restored.

### Stage updates and customer progress

Admins can choose a permitted next stage from the dropdown in each docket row,
then select Save stage. The application details dialog provides the same control
with an optional customer-facing note. Changes use the existing authenticated,
audited status endpoint. Invalid or stale transitions are rejected, and completion
requires a deliverable document.

Customer application cards and details show the current stage and recorded history.
Earlier stages absent from history are not labelled completed. Awaiting-payment
applications are counted separately from paid work in progress. Dashboard records
load on entry and update through Refresh now or after a saved change. There is no
timer-based, window-focus, or visibility-change polling.

## Transactional email with Resend

Eight repository-owned templates live in `apps/notifications/templates/notifications`:
welcome, verification, request received, payment confirmation, status update,
request completed, password reset and general notification. They share a responsive
HTML layout and have plain-text alternatives. No Resend dashboard templates are needed.

Preview without sending:

```sh
python manage.py preview_emails --output /tmp/nameassist-email-previews
```

Open the generated `index.html`. Its sample customer details and security tokens are
fictional. `EMAIL_DELIVERY_MODE=preview` is the default: events create preview records,
but never contact Resend or mark messages as sent. Preview records cannot later be sent.

For real delivery, verify `thisbookiyanga.com` in Resend by adding the DNS records
Resend provides. Domain registration alone does not verify it. The website can stay
at `https://nameassist.vercel.app`; it does not need the same domain as the sender.
Configure these values on the backend and worker (never in frontend variables):

```dotenv
EMAIL_DELIVERY_MODE=resend
RESEND_API_KEY=<Resend sending API key>
DEFAULT_FROM_EMAIL=NameAssist <nameassist@thisbookiyanga.com>
FRONTEND_URL=https://nameassist.vercel.app
EMAIL_PAYLOAD_ENCRYPTION_KEY=<shared random secret of at least 32 characters>
EMAIL_REPLY_TO=<optional inbox you actually monitor>
EMAIL_LOGO_URL=
```

Generate the encryption secret with `python -c 'import secrets; print(secrets.token_urlsafe(48))'`.
Store it securely, using the same value on web and worker. Do not change it while
messages are pending: queued payloads are encrypted with this key. It is separate
from the Django signing key. With no `EMAIL_REPLY_TO`, replies go to the sender;
creating a sending address does not create an inbox. Email footers link to the
existing dashboard support page. The logo defaults to the public website's
`/assets/nameassist-logo.png`; an optional absolute `EMAIL_LOGO_URL` overrides it.

Apply migrations with `python manage.py migrate`. Start the sender and one scheduler:

```sh
celery -A config worker -l info
celery -A config beat -l info --schedule=/tmp/nameassist-celerybeat
```

Docker Compose includes both services and mounts the same backend `.env`. For testing
against the hosted backend without buying a worker, run these two processes on your
own machine with that backend's database/Redis access and matching signing/encryption
keys. They must be able to reach those services; local Redis is not the hosted queue.
For Render, `docs/render-email-worker.yaml.example` contains an optional worker with
embedded beat. It is deliberately not provisioned by the existing blueprint because
workers require paid compute. Add it only when ready; keep one instance or move beat
to a single separate scheduler before scaling. The web service must migrate first.
No hosting resources are created by these repository changes.

Each committed event creates a durable outbox record. A broker outage leaves the
message pending; the scheduler recovers it. Retries keep the same recipient, content
and Resend idempotency key. Resend deduplicates keys for 24 hours, so ambiguous messages
beyond that window enter `review` rather than risk duplicates. Transient sends retry
up to eight times; expired verification/reset messages are never sent. Permanent
configuration failures appear as `failed`; correct configuration and issue a new
security link. For business messages requiring manual recovery, inspect the provider
history first; there is intentionally no blind resend button.

In Django admin, Notifications shows safe delivery metadata. `sent`/`sent_at` means
Resend accepted the email, not that it reached the inbox; inbox delivery and bounce
webhooks are not included. Historical mock notifications migrate to `legacy` and
are never replayed. Payloads, API keys and security tokens are not printed or exposed
in admin. Password-reset links expire in one hour and cannot be reused after a
successful reset. Verification links expire in 24 hours. Reset and resend requests
share database-backed limits of three per address and thirty per peer per 15 minutes.

The frontend supports `#/forgot-password`, `#/reset-password?token=...`, and
`#/verify-email?token=...`. Verification requires an explicit click, so an email
scanner merely visiting the page cannot verify the account. Tokens are captured in
memory and removed from the address bar. Refreshing that page requires reopening
the original email link.

Internal callers can enqueue a general notification using:

```python
from apps.notifications.delivery import enqueue_email

enqueue_email(kind='general', user=customer,
    context={'title': 'Your profile was updated', 'message': 'Your contact details have been saved.'},
    event_key=f'profile-update/{unique_event_id}')
```

Use a stable, unique event key per business event. Customer data is escaped; optional
action links must point to the configured frontend origin. Do not use this helper
for marketing or arbitrary external-recipient mail.

When buying a NameAssist domain later: verify it in Resend, change the sender,
reply-to and website settings, then restart web/worker. Templates need no edits.
Messages already queued retain their original sender and links.

Validation uses the backend Django test suite and frontend `npm test`, `npm run lint`
and `npm run build`. Provider HTTP is mocked in tests; no real email is sent.
A real inbox smoke test requires configured credentials and an explicit test recipient.

Provider references: [sending](https://resend.com/docs/api-reference/emails/send-email),
[idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[domain verification](https://resend.com/docs/dashboard/domains/introduction),
[Render workers](https://render.com/docs/deploy-celery).

## Admin document delivery and referral payments

Admins can upload PDF/JPG/PNG documents (maximum 10 MB each) from an application's
Documents tab or the admin Documents section. Files become deliverables on that
application and are available to its owner through the existing authenticated
customer download endpoint. Other customers cannot read them. Uploads create audit
records; uploading does not automatically change the application stage.

The admin Referrals section lists pending rewards, recorded manual payments and
legacy records. **Approve & record payment** means the operator has already made
the transfer themselves. It never calls a transfer provider. The request to
`POST /api/v1/admin/referral-rewards/disburse/` now requires:

```json
{
  "reward_id": "<reward UUID>",
  "amount": "1250.50",
  "payment_reference": "<bank transfer reference>",
  "confirmed_paid": true,
  "bank_details": {
    "bank_name": "<bank used for the transfer>",
    "account_number": "<destination account number>",
    "account_name": "<destination account name>"
  },
  "note": "Optional administrative note"
}
```

A positive NGN amount, unique reference and complete referrer bank details are
required. A reward can be recorded only once. The audit event preserves previous
and recorded amounts, payment reference, note, the payment destination explicitly confirmed by the operator,
operator and timestamp. Later profile edits do not rewrite the payment history.
`GET /api/v1/admin/referral-rewards/<id>/history/` returns that history to admins.

Run `python manage.py migrate` before serving the updated admin interface.
Migration `payments.0005_referral_manual_payment` labels old mock transfers as
legacy simulated records, which are excluded from manual-payment totals. Existing
paid legacy records are kept unchanged and cannot be paid again through this action.
The old mock payout request accepting only `reward_id` is intentionally no longer
supported: all manual payment details and confirmation must be supplied.
# SIRI.DEV
