# GlobalCorp Succession Planning System

A full-stack enterprise succession planning application built with React, Node.js, Express, Prisma, and PostgreSQL.

## Features

- Executive dashboard with KPIs and charts
- Org structure hierarchy viewer
- Critical position tracking with successor assignment
- Risk assessments with flight risk and engagement scores
- Talent pool management with development tracking
- Workflow approvals (Draft → Review → Approval → Finalized)
- Retirement exposure analysis
- Reports with CSV export
- Role-based access control (Admin, HR, Manager, Executive Viewer)

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router v6, Axios
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL 15
- **Auth:** JWT + bcryptjs
- **Deployment:** Docker Compose

## Default Login Credentials

| Role             | Email                        | Password      |
|------------------|------------------------------|---------------|
| Admin            | admin@company.com            | Admin@123     |
| HR               | sarah.hr@company.com         | Password@123  |
| Manager          | james.manager@company.com    | Password@123  |
| Executive Viewer | exec@company.com             | Password@123  |

---

## Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

```bash
cd succession-planning
docker-compose up --build
```

The app will be available at:
- **Frontend:** http://localhost:5173
- **API:** http://localhost:5000/api

The database will be seeded automatically on first start.

---

## Manual Setup (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 15 running locally

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE succession_db;"
```

### 2. Setup the server

```bash
cd server
npm install
# Edit .env to point to your PostgreSQL instance
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

### 3. Setup the client

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The client runs at http://localhost:5173, the API at http://localhost:5000.

---

## Environment Variables (server/.env)

| Variable      | Description                      | Default                                              |
|---------------|----------------------------------|------------------------------------------------------|
| DATABASE_URL  | PostgreSQL connection string     | postgresql://postgres:postgres@localhost:5432/succession_db |
| JWT_SECRET    | Secret key for JWT signing       | your-super-secret-jwt-key-change-in-production       |
| PORT          | Server port                      | 5000                                                 |
| CLIENT_URL    | Frontend URL for CORS            | http://localhost:5173                                |

---

## Exposing to the Internet (ngrok)

1. Install ngrok: https://ngrok.com/download
2. Start the app with Docker or manually
3. Run:

```bash
ngrok http 5173
```

This gives you a public URL like `https://abc123.ngrok.io` to share with others.

---

## Project Structure

```
succession-planning/
├── docker-compose.yml
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── api/          # Axios instance
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth context
│   │   └── pages/        # Route pages
│   └── nginx.conf        # Nginx config for Docker
└── server/               # Express + Prisma backend
    ├── prisma/
    │   ├── schema.prisma # Database schema
    │   └── seed.js       # Seed data
    └── src/
        ├── middleware/   # Auth middleware
        └── routes/       # API route handlers
```

---

## API Endpoints

| Method | Endpoint                         | Description                    |
|--------|----------------------------------|--------------------------------|
| POST   | /api/auth/login                  | Login                          |
| GET    | /api/auth/me                     | Get current user               |
| GET    | /api/dashboard/metrics           | Dashboard KPIs                 |
| GET    | /api/org-units                   | List org units                 |
| GET    | /api/org-units/tree              | Org hierarchy tree             |
| GET    | /api/positions                   | List positions                 |
| GET    | /api/employees                   | List employees                 |
| GET    | /api/risk-assessments            | List risk assessments          |
| GET    | /api/successors                  | List successors                |
| GET    | /api/talent-pools                | List talent pools              |
| GET    | /api/workflows                   | List workflows                 |
| PUT    | /api/workflows/:id/advance       | Advance workflow status        |
| PUT    | /api/workflows/:id/reject        | Reject workflow                |
| GET    | /api/reports/critical-roles      | Critical roles report          |
| GET    | /api/reports/risk-summary        | Risk summary report            |
| GET    | /api/reports/retirement-risk     | Retirement risk report         |
| GET    | /api/reports/successor-readiness | Successor readiness report     |
