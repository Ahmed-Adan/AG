# Alhatimi Glass and Glazing — Quotation Management System

A production-ready quotation management system for an aluminum, glass & glazing
contractor: customer/project intake, line-item quotations with live area/amount
calculations, luxury PDF generation, WhatsApp/Excel/print sharing, role-based
access (Admin/Manager/Staff), a dashboard, a 7-report reporting suite, and
JSON-based database backup/restore.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma 7 +
PostgreSQL, Auth.js v5, react-hook-form + zod, `@react-pdf/renderer`, and
`exceljs`.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Set `DATABASE_URL` in `.env` (see `.env.example`) to point at a PostgreSQL
database, then run the migration:

```bash
npx prisma migrate dev
```

### 3. Seed demo data

```bash
npm run db:seed
```

This creates three demo accounts and one sample quotation:

| Role    | Email                        | Password    |
| ------- | ----------------------------- | ----------- |
| Admin   | admin@alhatimiglass.com       | Admin@123   |
| Manager | manager@alhatimiglass.com     | Manager@123 |
| Staff   | staff@alhatimiglass.com       | Staff@123   |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | Description                                             |
| ------------------ | -------------------------------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack)                          |
| `npm run build`     | Production build                                          |
| `npm start`         | Run the production build                                  |
| `npm run lint`      | ESLint (flat config)                                       |
| `npm test`          | Unit tests (Vitest) — calculations, permissions, numbering |
| `npm run smoke`     | API smoke test against a running dev server                |
| `npm run db:seed`   | Re-run the Prisma seed script                               |

## Architecture notes

- **Calculation engine** (`src/lib/calculations.ts`): pure functions shared by
  the client form (live totals as you type) and the API routes (server
  re-computes and persists — the client's submitted totals are never trusted).
- **Quotation numbering** (`src/lib/quotation-number.ts`): atomic
  `INSERT ... ON CONFLICT` upsert against a per-year counter row, run inside
  the same transaction as the quotation insert.
- **Auth** (`src/lib/auth.ts`, `src/proxy.ts`): Auth.js v5 Credentials
  provider, JWT sessions. Next.js 16 renamed `middleware.ts` to `proxy.ts`;
  Proxy always runs on the Node.js runtime, so it can call `auth()` directly.
- **Permissions** (`src/lib/permissions.ts`): a role → capability matrix
  (Admin/Manager/Staff) enforced in every mutating API route. The UI reads the
  same matrix to hide/disable actions, but the API is the real boundary.
- **PDF** (`src/components/pdf/quotation-document.tsx`,
  `src/lib/pdf/generate-quotation-pdf.tsx`): one `@react-pdf/renderer`
  template reused for Download, Print, and WhatsApp Share.
- **Backup/restore** (`src/app/api/backup/*`): a JSON dump/restore of every
  table, wrapped in a single transaction, gated to Admins with a typed
  "RESTORE" confirmation in the UI.

## Prisma 7 notes

This project uses Prisma 7's new client generator (`provider = "prisma-client"`),
which generates into `src/generated/prisma` and requires an explicit driver
adapter — see `src/lib/prisma.ts` (`@prisma/adapter-pg`). Connection
configuration lives in `prisma.config.ts`, not in `schema.prisma`.
