# MediFlow Connect

**MediFlow Connect** is a sophisticated healthcare management platform designed to streamline medical workflows, inventory tracking, and communication between **Doctors** and **Medical Representatives (M.R.s)**. Built for performance, security and a polished UX.

## Technology Stack

### Frontend (Vercel-style static SPA)
- **React 19 + Vite + TanStack Router / Query**
- **Tailwind CSS v4**, Radix UI primitives, Shadcn-style components
- **Framer Motion** for orchestrated page + element transitions
- **Lenis** for buttery-smooth scroll
- **tsParticles** for the animated particle background
- **Glassmorphism** layered over an **animated aurora** gradient
- **Dark / light theme** with system-mode detection (persisted in `localStorage`)

### Backend (Express REST API)
- **Node.js + Express + TypeScript**
- **PostgreSQL** accessed via `postgres.js` (raw SQL, full control)
- **Custom OTP-only auth** — no Supabase Auth, no passwords. Users sign up / sign in with email + a 6-digit code emailed via Nodemailer.
- **JWT (HS256)** issued by the backend, verified by `requireAuth` middleware
- **Nodemailer** for branded HTML OTP emails (login + signup)
- **Audit logging** to `audit_logs` on every inventory / order mutation

### Database (Supabase Postgres)
- `profiles`, `email_otps`, `contacts`, `inventory_items`, `orders`, `order_items`, `messages`, `audit_logs`
- All schema in `backend/supabase/migrations/`
- The `auth.users` table is **no longer used** — user identity lives entirely in `profiles` + `email_otps`

## Project Structure

```text
mediflow-connect/
├── backend/                     # Express + TypeScript API
│   ├── .env.example             # Environment template
│   ├── src/
│   │   ├── lib/                 # db, jwt, mailer, email-otp, email-templates
│   │   ├── middleware/          # requireAuth (verifies our JWT)
│   │   ├── routes/              # auth, dashboard, inventory, orders, ...
│   │   ├── utils/               # audit.ts (writes to audit_logs)
│   │   └── server.ts            # Express app entry
│   └── supabase/                # SQL migrations
└── frontend/                    # React 19 SPA
    ├── src/
    │   ├── components/          # GlassCard, ParticleField, SmoothScroll, ThemeToggle, ...
    │   ├── context/             # auth-context (calls backend /auth/me), theme-provider
    │   ├── lib/                 # api.ts — single fetch helper, JWT in localStorage
    │   └── routes/              # /login, /signup, /dashboard, /inventory, ...
    └── .env.example             # VITE_API_URL only
```

## Key Features

- **3-tier architecture** — frontend knows nothing about the DB layer
- **Passwordless auth** — email + 6-digit OTP, no passwords anywhere
- **Real-time-feel** — chat polls `/api/messages/:contactId` every 5 s
- **Notification badges** — `/api/notifications/unread` polled every 10 s
- **Inventory** — add, edit, delete, low-stock alerts, expiry tracking
- **Orders** — full lifecycle (pending -> accepted -> packed -> out for delivery -> delivered)
- **Contacts** — role-aware (doctor <-> MR), search by phone
- **Audit logging** — every inventory/order mutation
- **Polished UX** — glassmorphism cards, animated aurora gradient, particle field, framer transitions, smooth scroll, dark/light mode

## Development Setup

### Prerequisites
- Node.js 20+
- npm

### 1. Install

```bash
# from the repo root
npm run install:all
```

### 2. Configure

`backend/.env` (use `backend/.env.example` as a template):
```env
DATABASE_URL=postgresql://postgres.<project>:%23<pass>%40<word>@aws-<region>.pooler.supabase.com:6543/postgres
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT signing secret — used to sign 7-day access tokens
JWT_SECRET=<long random string, at least 32 chars>

# SMTP (used to send login + signup OTP codes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="MediFlow <your-email@gmail.com>"
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### Generate JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

#### SMTP setup (Gmail)

1. Enable **2-Step Verification** on the Google account.
2. Create an **App Password** at <https://myaccount.google.com/apppasswords> (select app: Mail, device: Other -> "MediFlow").
3. Paste the 16-character password (no spaces) into `SMTP_PASS`.
4. Keep `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`.
5. Restart the backend.

### 3. Run the new migration

The OTP flow needs the `email_otps` table and the `profiles.id` foreign key dropped. Apply the new migration:
```bash
# via Supabase CLI
supabase db push

# or paste backend/supabase/migrations/20260603000000_otp_only_auth.sql
# into the Supabase SQL editor and run it.
```

### 4. Run

```bash
# from the repo root — runs backend + frontend in parallel
npm run dev
```

- Backend:  http://localhost:5000/health
- Frontend: http://localhost:3000

## Auth Flow

```
SIGNUP
  POST /api/auth/signup       { email, full_name, phone, role }
  -> 200  (OTP emailed)
  POST /api/auth/verify-signup { email, otp, full_name, phone, role }
  -> 200  { access_token, profile }

LOGIN
  POST /api/auth/login        { email }
  -> 200  (OTP emailed — only if profile exists)
  POST /api/auth/verify-otp   { email, otp }
  -> 200  { access_token, profile }

RESEND OTP
  POST /api/auth/send-otp     { email }
  -> 200  (same as login step 1)

LOGOUT
  POST /api/auth/logout       (stateless, just clears the token client-side)

ME
  GET  /api/auth/me           (requires Bearer token)
  -> 200  { profile }
```

OTPs are 6 digits, valid for 10 minutes, single-use (marked `consumed_at` on first verify).

## Security Model

- All `/api/*` routes (except `/api/auth/*`) require a valid `Authorization: Bearer <jwt>` header
- JWTs are HS256-signed by the backend (`JWT_SECRET`), 7-day expiry
- The backend verifies every token with `jsonwebtoken` before any DB query
- OTPs are stored as SHA-256 hashes in `email_otps`, not in plaintext
- Database mutations are owned by the backend; the frontend never sees `DATABASE_URL` or `JWT_SECRET`

## License
Private Repository - All Rights Reserved.
