# Agent workflow — Fuel EU Maritime dashboard

This note captures how the project was built with **Cursor** and **Claude Sonnet** (and related agent features): architecture choices, a common macOS networking snag, and how tab state persistence was handled.

---

## Cursor + Sonnet and hexagonal architecture

Development was **chat-driven and iterative**: prompts described layers (domain, application, ports, adapters, UI), and the agent generated or refactored TypeScript to match.

**Hexagonal layout (frontend and backend):**

- **Core / domain** — Types and rules (e.g. routes, KPIs R001–R005, compliance snapshots, pool DTOs).
- **Core / application** — Pure functions and use-cases (GHG intensity, compliance checks, Article 20 banking caps, Article 21 pool validation, percentage deltas, pool balance sums).
- **Ports** — Interfaces (`VoyageRoutesPort`, `CompliancePort`, `BankingPort`, `PoolingBalancesPort`, `PoolManagementPort`, `RouteComparisonPort`, etc.).
- **Adapters / infrastructure** — Axios clients calling `http://localhost:5000` (or `VITE_API_URL`), implementing those ports.
- **Adapters / UI** — React tabs wired to ports via props (no business logic in HTTP details).

Sonnet was used to **scaffold**, **extend APIs** (e.g. `GET /compliance/cb?year=`, `POST /banking/apply`, `GET /routes/comparison`), and **align UI** with backend contracts—often in small steps: backend route first, then port + adapter, then tab component.

---

## MacBook port 5000 and AirPlay

On **macOS**, **AirPlay Receiver** can bind **TCP port 5000**, which conflicts with an Express API also configured for port **5000**. Symptoms include the backend failing to listen (`EADDRINUSE`) or the wrong process answering on that port.

**Typical ways to resolve it:**

1. **Turn off AirPlay Receiver** — *System Settings → General → AirDrop & Handoff* (or *Sharing*) — disable **AirPlay Receiver** so port 5000 is free for the API.
2. **Run the API on another port** — Change `PORT` in the backend server (e.g. `5001`) and point the frontend `http-client` / `VITE_API_URL` at the same port.

Pick one approach for local dev; document the chosen port for anyone cloning the repo.

---

## State persistence: CSS-based tab switching

Early on, tabs were **conditionally rendered** (`{tab === 'banking' && <BankingTab />}`). That **unmounts** inactive tabs, so React **reset local state** (form fields, year selection, KPI strip, pool checkboxes, etc.) when switching away.

**Fix:** Keep **one** piece of global UI state (`tab` / active tab id) and **always mount** all tab components. Wrap each in a container whose visibility is toggled with **Tailwind**:

```tsx
<div className={tab === 'banking' ? 'block' : 'hidden'}>
  <BankingTab ... />
</div>
```

`hidden` applies `display: none`; components stay in the tree, so **internal `useState` survives tab changes**. No Context was required for this behavior—only a presentation-layer change in `App.tsx`.

---

## Iterative build: Banking (Article 20) and Pooling (Article 21)

Work proceeded in **vertical slices**, often backend-then-frontend:

### Article 20 — Banking

1. **Domain / application** — Surplus-only banking, caps tied to energy × ceiling, ledger entries.
2. **HTTP** — `POST /banking/bank`; later **`GET /compliance/cb?year=`** for year-scoped balances and **`POST /banking/apply`** to consume banked amounts against deficits (with apply ledger and effective compliance balance).
3. **Frontend** — `BankingTab`: KPI strip (`cb_before`, `applied`, `cb_after`), surplus/deficit route pickers, 400 error messaging, Varuna styling.
4. **Refinement** — Seed data and rules adjusted so aggregate CB and same-vessel apply flows were demonstrable.

### Article 21 — Pooling

1. **Backend** — `validatePoolArticle21`: pooled weighted intensity vs regulatory ceiling; `POST /pools` persists pool configuration.
2. **Frontend** — `PoolingTab`: compliance-driven route list, multi-select, live **total pool balance** with red/teal semantics, **Verify & create pool** gated on sum ≥ 0 (per product spec), `POST /pools` on success.
3. **Data** — `GET /compliance/cb` (and route names from `GET /routes` where needed) wired through hexagonal adapters.

Each slice was **reviewed in the IDE**, then the next prompt extended behavior (filters, comparison endpoint, banking apply, tab persistence) without collapsing layers together.

---

## Summary

| Topic | Approach |
|--------|-----------|
| **AI-assisted design** | Cursor + Sonnet for structured prompts; hexagonal boundaries kept explicit. |
| **Port 5000** | macOS AirPlay vs API—disable AirPlay Receiver or change API port + env. |
| **Tab state** | Always render tabs; `block` / `hidden` wrappers in `App.tsx`. |
| **Banking / Pooling** | Iterative API + UI; Article 20 ledger/apply; Article 21 validation + pool create. |

This file is a **project memoir** for onboarding and future refactors—not a runtime spec. For exact endpoints and types, refer to `backend/src` and `frontend/src/core`.
