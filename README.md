[![NEVADA](/public/NEVADA_Logo.png)](https://github.com/massyakur/GarudaAI-UMKM)

# NEVADA Frontend

Nusantara Enterprise Virtual Assistant & Data Analytics for UMKM. This Next.js 15 + TypeScript + Tailwind/shadcn interface talks directly to a FastAPI backend (no Clerk/Supabase). It covers login, product/customer/transaction management, receipt OCR, analytics dashboards, and an AI content agent.

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui components
- Context-based JWT auth with localStorage
- Fetch helpers in `src/lib/api.ts` hitting the FastAPI gateway

## Setup
1) Install dependencies:
```bash
npm install
```
2) Configure environment:
```bash
cp .env.example .env
```
Set `NEXT_PUBLIC_API_URL` to your FastAPI base (e.g. `https://9812afe22a53.ngrok-free.app`).

3) Run dev server:
```bash
npm run dev
```
Open http://localhost:3000. Use the login page to obtain a token from `/api/v1/login`.

## Key Features
- **Auth**: `AuthContext` stores JWT + user, guards protected routes, persists to localStorage.
- **API helpers**: `src/lib/api.ts` wraps all FastAPI endpoints (auth, products, customers, transactions, analytics, OCR, content agent) with error handling.
- **Dashboard**: Revenue/transaction/customer/product cards, daily sales chart, payment mix, top products, credit-readiness prompt.
- **CRUD Pages**: Products, Customers, Transactions (with status/date filters, edit/delete, and OCR import).
- **Reports**: Sales report, monthly report, and top products with configurable ranges.
- **Content Agent**: Chat UI that sends text + optional image to `/api/v1/content-agent/chat`, with history management.

## Project Structure (selected)
```
src/
  app/
    (app)/layout.tsx              # Protected shell with navigation
    (app)/dashboard/page.tsx
    (app)/products/page.tsx
    (app)/customers/page.tsx
    (app)/transactions/page.tsx
    (app)/reports/page.tsx
    (app)/content-agent/page.tsx
    login/page.tsx                # JWT login
    page.tsx                      # Marketing/landing
  components/
    ui/*                          # shadcn/ui primitives
    theme-provider.tsx            # theme wrapper
    theme-toggle.tsx              # light/dark toggle
  context/AuthContext.tsx         # auth state + actions
  lib/api.ts                      # FastAPI fetch helpers
  lib/utils.ts
```

## Environment
```env
NEXT_PUBLIC_API_URL= $BackendUrl
```

## Notes
- Supabase and Clerk code have been removed in favor of direct FastAPI calls.
- Receipt OCR expects `/api/v1/ocr/upload`; adjust if your backend differs.
- AI agent endpoints live under `/api/v1/content-agent/*`.

## Scripts
- `npm run dev` – start development server
- `npm run build` – production build
- `npm run lint` – lint code

## Contributing
PRs are welcome. Keep changes in English and align with the FastAPI contract in `src/lib/api.ts`.
