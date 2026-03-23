# Varuna Marine — Fuel EU Compliance Dashboard

A full-stack reference implementation for **Fuel EU Maritime**–style compliance workflows: voyage routes, intensity comparison, **Article 20** banking, and **Article 21** pooling. The UI uses a **Varuna Marine** dark navy / teal theme.

---

## Tech stack

| Layer        | Technologies                                                                                                                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | [React](https://react.dev/) 18, [Tailwind CSS](https://tailwindcss.com/) 3, [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), [Axios](https://axios-http.com/), [Recharts](https://recharts.org/) |
| **Backend**  | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), **TypeScript**                                                                                                                                           |

---

## Architecture

The codebase follows **hexagonal architecture** (ports and adapters):

- **Domain** — Entities, value types, and KPI identifiers (e.g. R001–R005).
- **Application** — Use cases and pure logic (GHG intensity, compliance balance, banking caps, pool validation).
- **Ports** — Interfaces for outbound dependencies (repositories, policy, HTTP contracts).
- **Adapters** — Express route handlers, in-memory stores, Axios clients, and React UI components that depend on ports—not on concrete infrastructure details.

This keeps regulatory and UI concerns testable and swappable (e.g. replacing the in-memory store with a database later).

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (bundled with Node)

---

## Setup and local development

### 1. Backend API

```bash
cd backend
npm install
npm run dev
```

The API listens on **http://localhost:5000** by default.

- **Production-style run:** `npm run build` then `npm start`.

### 2. Frontend dashboard

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

The app is served by Vite (typically **http://localhost:5173**).

The frontend expects the API at `http://localhost:5000` unless you set **`VITE_API_URL`** in a `.env` file.

### 3. Run both together

1. Start **backend** (`backend/npm run dev`).
2. Start **frontend** (`frontend/npm run dev`).
3. Open the Vite URL in your browser.

### Database Setup

This project uses PostgreSQL as the primary database with Prisma ORM.

1. Ensure PostgreSQL is running locally.
2. Configure your connection string in `backend/.env`.
3. Run migrations: `npx prisma db push`
4. Seed initial route data: `npx tsx prisma/seed.ts`

> **macOS note:** If port **5000** is already in use (e.g. **AirPlay Receiver**), either disable AirPlay Receiver in **System Settings** or change the backend port and point `VITE_API_URL` at the new port.

---

## Features

- **Routes visualization** — Table of voyages with filters (vessel, fuel intensity, year), energy and WtW intensity, and **Set baseline** actions backed by the API.
- **Banking (Article 20)** — Compliance balance by reporting year, bank surplus, apply banked amounts to deficits, KPI-style feedback and error handling.
- **Pooling (Article 21)** — Multi-select routes, live pool balance indicator, validation against regulatory rules, and **create pool** via `POST /pools`.

Additional tabs (e.g. **Compare**) chart intensity vs. regulatory target using dedicated comparison endpoints.

---

## Build for production

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm run preview
```

---

## Repository layout

```
backend/     # Express API, domain, application, adapters
frontend/    # Vite + React + Tailwind SPA
```

For a narrative of how the project was developed (Cursor workflow, port 5000, tab persistence), see **`AGENT_WORKFLOW.md`**.
