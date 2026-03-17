# /api/dashboard contract

Current internal dashboard endpoint used by `/dashboard` in dev.

## Route

- `GET /api/dashboard`
- `GET /api/dashboard/session`
- `POST /api/dashboard/login`
- `POST /api/dashboard/logout`

## Purpose

Returns one normalized payload for the dashboard UI so the frontend does not need to talk to multiple data sources directly.

The dashboard is now password-protected in dev via a simple cookie-backed gate:
- unauthenticated requests to `GET /api/dashboard` return `401`
- login is done by posting a password to `POST /api/dashboard/login`
- successful login sets an HTTP-only session cookie

## Current sources

- BudgetTools runs from `/opt/BudgetTools/runs`
- Actual Budget health from `https://budget.albretsen.no`
- Spending snapshot from the live Actual instance via:
  - `POST /account/login`
  - `GET /sync/download-user-file` with `X-ACTUAL-FILE-ID`
- Site health from:
  - `https://albretsen.no`
  - `https://dev.albretsen.no`
- Calendar from GOG / Google Calendar
- Weather from Open-Meteo
- VPS metrics from the host
- Container status from the local container runtime (`podman` first, `docker` fallback)

## Response shape

```ts
type ServiceStatus = 'healthy' | 'warning' | 'error' | 'unknown'
type DataMode = 'live' | 'placeholder'

type DashboardMetric = {
  label: string
  value: string
  tone?: ServiceStatus
}

type DashboardPayload = {
  generatedAt: string
  lastRefresh: string
  serviceCards: Array<{
    title: string
    status: ServiceStatus
    detail: string
    summary: string
    mode?: DataMode
  }>
  budgetRuns: Array<{
    timestamp: string
    result: 'success' | 'partial' | 'failed'
    summary: string
    meta: string
    mode?: DataMode
  }>
  spendingMetrics: DashboardMetric[]
  spendingCategories: Array<{
    label: string
    value: string
    width: string
  }>
  funLibsMetrics: DashboardMetric[]
  calendar: {
    mode?: DataMode
    status?: ServiceStatus
    detail?: string
    events: Array<{
      time: string
      title: string
      meta: string
    }>
  }
  weather: {
    temperature: string
    condition: string
    range: string
    detail: string
    mode?: DataMode
  }
  vpsMetrics: DashboardMetric[]
}
```

## Field notes

### `generatedAt`
- Human-readable freshness label for the whole payload.

### `lastRefresh`
- Human-readable refresh cadence label.

### `serviceCards`
- Top health row.
- Intended cards today:
  - BudgetTools
  - Actual Budget
  - albretsen.no
  - dev.albretsen.no

### `budgetRuns`
- Latest three BudgetTools runs.
- The dashboard derives safer UI state than the raw runner file when needed.
- Important quirk today:
  - the BudgetTools runner can leave `status: "running"` in `summary.json` even after a failed exit
  - dashboard logic corrects for that using `exitCode`

### `spendingMetrics`
- Topline spending summary for the current month.
- Current fields:
  - This month
  - Largest category
  - Transactions

### `spendingCategories`
- Top category list for the current month.
- `width` is already UI-ready for simple CSS bar rendering.

### `funLibsMetrics`
- Placeholder for now.
- Intended to be replaced by a real source later.

### `calendar`
- Encapsulates both calendar card state and events.
- Designed so blocked or degraded states can be shown calmly without leaking raw command output.
- `detail` should be user-facing.
- `events` may contain a single placeholder item in blocked/unavailable states.

### `weather`
- Current provider: Open-Meteo.
- Kept provider-agnostic so it can be swapped later.

### `vpsMetrics`
- Compact high-signal host metrics only.
- Current live fields:
  - CPU load from the host
  - RAM usage from the host
  - root disk usage from `df -h /`
  - uptime from the host
  - container runtime summary from local `podman`/`docker`
- Important nuance:
  - not every container has a health check configured
  - the dashboard therefore separates `running` count from `healthchecks passing`

## UI rules for consumers

- Do not assume every section is live.
- Respect `mode: 'placeholder'`.
- Respect per-section warning/error states instead of failing the whole page.
- Prefer `detail` and `summary` fields over reconstructing text in the client.

## Known follow-ups

- Add Fun Libs real data
- Decide whether to expose a machine-friendly `generatedAtIso`
- Consider moving the dev-only Vite middleware endpoint into a dedicated backend service later
