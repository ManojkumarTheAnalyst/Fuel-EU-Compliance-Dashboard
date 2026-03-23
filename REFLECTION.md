# Reflection — Fuel EU Maritime compliance UI

This document reflects on **what made the work hard**, how we kept **pooling numbers honest** relative to Article 21, and a small **UX decision** that paid off.

---

## Challenges of implementing Fuel EU Maritime regulations

Fuel EU Maritime is a **dense regulatory frame**: well-to-wake GHG intensity, multi-year targets, banking and pooling under **Articles 20 and 21**, and reporting concepts that do not map one-to-one to a CRUD app.

**Regulatory fidelity vs. product speed**  
We deliberately used **simplified, explainable rules** in code (e.g. caps and ledgers that mirror the _spirit_ of Article 20, pooled intensity vs. a ceiling for Article 21) while staying clear that this is a **dashboard prototype**, not certified compliance software. The hard part is knowing where to stop modeling so the team can still **ship, test, and iterate**.

**Units and mental models**  
Intensity (gCO₂e/MJ), energy (MJ), and “compliance balance” style quantities are easy to mix up. A recurring challenge was **naming and comments** so engineers and stakeholders agree whether a positive balance means “deficit vs. target” or “surplus” in a given screen. Misaligned sign conventions break filters, colors, and button enablement.

**Cross-cutting flows**  
Banking changes **effective** balances when redemptions are applied; pooling **aggregates** voyages. Wiring **year-scoped** APIs, keeping the UI consistent after a bank/apply action, and avoiding duplicate sources of truth required discipline at the **port/adapter** boundary.

**Local development friction**  
Unrelated platform issues (e.g. **port 5000** on macOS) are not “regulation,” but they interrupt the feedback loop. Documenting them early keeps focus on the domain instead of on environment mysteries.

---

## Total Pool Balance and After Pooling Balance (Article 21 consistency)

In this project, **Article 21** is represented at two levels:

1. **Pooled technical compliance** — The backend checks whether the **energy-weighted average** well-to-wake intensity of the selected routes is **at or below** the regulatory ceiling for the reporting year (`POST /pools` validation).

2. **Pool balance in the UI** — The dashboard shows a **Total Pool Balance** (sum of selected routes’ **effective** MJ-weighted compliance balances) and an **After Pooling Balance** panel.

**Mathematical consistency**  
For a **single reporting year** and a **single regulatory ceiling** \(C\) applied to all members of the pool, the sum of per-route MJ-weighted gaps is the same as the gap computed from the **pooled** intensity:

\[
\sum_i (I_i - C)\,E_i = \left(\frac{\sum_i I_i E_i}{\sum_i E_i} - C\right) \sum_i E_i
\]

where \(I_i\) is intensity and \(E_i\) is energy for route \(i\). So the **aggregate “balance” number** you see as the sum of individuals **matches** the pooled MJ-weighted position under that uniform ceiling. The UI states this explicitly so users are not left thinking two different formulas are fighting each other.

**What remains distinct**  
**Article 21** in law is not only “add the numbers”; the **save** path still enforces the **pooled intensity ≤ ceiling** rule. The UI uses the shared sum for **indicators and gating** (e.g. creation rules) while the server remains the **authority** for whether a pool configuration is accepted.

---

## CSS `hidden` and tab navigation UX

Tab panels were initially easy to implement with **conditional rendering** (`{activeTab === 'x' && <Tab />}`). That **unmounts** inactive tabs, so React **drops all local state**—draft amounts, selected routes, year pickers, and messages—whenever the user switches tabs. For a workflow-heavy compliance screen, that feels **fragile and unforgiving**.

**Decision:** Always **mount** all tab components and toggle visibility with **Tailwind** (`block` vs `hidden`), so inactive panels are only **not displayed**, not destroyed.

**Why it helps UX**  
Users can **compare, bank, and pool** without losing context when they jump between tabs. No global Context was required for that behavior; it is a **presentation-layer** choice with a large payoff for perceived quality.

**Trade-off**  
All tabs stay in memory and may run effects on first mount; for this app size that is acceptable. If the app grows, **lazy loading** or **splitting heavy tabs** can be reconsidered without giving up the idea of **preserving state** while hidden.

---

## Closing thought

The hardest part of “Fuel EU” software is rarely the chart—it is **aligning simplified models with regulatory intent**, **keeping numbers consistent across screens**, and **removing friction** so experts can explore scenarios without fighting the UI. This prototype is a step in that direction.

- **Database Integration:** Using AI agents allowed me to quickly generate the Prisma schema and seed data for the FuelEU Maritime routes (R001-R005). What would have taken an hour of manual boilerplate writing was done in minutes.
- **Architectural Integrity:** The agent helped me maintain the Hexagonal Architecture even while switching from mock data to a real PostgreSQL database, ensuring that the domain logic remained decoupled from the database adapters.
