# Mini ERP + CRM Operations Portal

Full-stack case study project. See `backend/README.md` and this file for setup.

## Architecture

- **backend/** — Node.js + TypeScript + Express + Prisma + PostgreSQL. JWT auth with 4 roles
  (Admin, Sales, Warehouse, Accounts). Modules: Customers (CRM), Products/Inventory, Sales Challans.
- **frontend/** — React + TypeScript + Vite. Login page + 3 module pages (Customers, Products, Challans).

## Quick start (local)

Terminal 1:
```
cd backend
npm install
cp .env.example .env      # edit DATABASE_URL to point at your local/hosted Postgres
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Terminal 2:
```
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the frontend URL Vite prints (usually http://localhost:5173) and log in with
`admin@example.com` / `password123` (see backend README for all 4 seeded accounts).

## Deployment

- **Backend + DB**: Render (Web Service + PostgreSQL) — see backend/README.md for exact steps.
- **Frontend**: Vercel or Netlify — set `VITE_API_URL` to your deployed backend URL.

## Known limitations / what's left to finish

This scaffold implements the core required modules and business logic end-to-end
(auth/roles, customer CRUD + follow-ups, product CRUD + stock movement log, challan
draft/confirm/cancel with atomic stock deduction and product snapshotting). Still to do
before submission:

- Customer detail page (follow-up notes UI) — API exists (`GET /customers/:id`,
  `POST /customers/:id/follow-ups`), needs a frontend page.
- Product edit form + stock movement UI on the frontend — API exists.
- Pagination controls in the UI (API supports `page`/`limit`, tables currently show first page only).
- Postman collection export.
- Docker setup, GitHub Actions, PDF invoice export, S3 image upload (all bonus items).
- Actual deployment + screen recording for submission.
