# albretsen.no Dashboard Design Document

## Purpose

Create a new page at `albretsen.no/dashboard` that works as a personal status dashboard.

This is **not** a separate product with its own visual identity. It is an expansion of the existing `albretsen.no` website and should feel like part of the same site, while being much more utility-focused than the landing page.

The page will primarily be displayed on an **11-inch tablet connected to a Raspberry Pi 4 (4 GB RAM)**, but it must also work well in regular desktop browsers.

The goal is to give a fast, glanceable overview of:

- BudgetTools status and recent runs
- spending summary
- Actual Budget health
- `albretsen.no` health
- important VPS/system details
- Fun Libs metrics/data
- today’s calendar events
- weather for Bergen

---

## Existing Context

The current site is an existing personal landing page at `albretsen.no`.
The frontend should be treated as an extension of that site, not as a standalone admin panel.

Relevant known implementation context:

- Existing site stack: **React + Vite + TypeScript**
- Dev environment currently exposed at **`dev.albretsen.no`**

---

## High-Level Product Direction

### What this dashboard should feel like

The dashboard should feel like:

- calm
- information-dense without being cluttered
- readable from a slight distance on a tablet
- modern, but not flashy
- practical first, aesthetic second

### What this dashboard should not feel like

Avoid making it feel like:

- a generic SaaS admin template
- a wall of tiny widgets
- a mobile phone UI stretched to tablet size
- a terminal-themed gimmick
- a page where every data source has equal visual weight

The most important thing is **at-a-glance usefulness**.

---

## Main User Story

As Asgeir, I want to open `albretsen.no/dashboard` and immediately understand:

- whether my important services are healthy
- whether BudgetTools has run recently and correctly
- what my spending looks like right now
- whether anything needs attention today

I should not have to click around to get the main value from the page.

---

## Navigation Requirements

The dashboard must be reachable from the landing page.

### Required navigation changes

Frontend developer should add:

- a clear navigation link to `/dashboard` from the landing page
- placement should fit the current site design
- link should be available on desktop and tablet layouts

### Recommended navigation approach

Use one of these patterns depending on current site layout:

- top navigation link labeled **Dashboard**
- primary CTA or secondary CTA on the landing page
- a small but visible header/nav element if the homepage is minimal

### Additional recommendation

The dashboard page itself should include a way back to the landing page, such as:

- site logo linking to `/`
- a small “Home” link in the header

---

## Primary Screen Target

### Primary display

- **11-inch tablet**
- likely landscape orientation most of the time
- Raspberry Pi 4 with limited resources

### Implications for design

The dashboard should be optimized for:

- low animation usage
- efficient rendering
- no heavy charting libraries unless clearly justified
- strong typography and spacing
- large-enough tap targets
- readable cards without relying on hover

### Secondary display targets

Also support:

- normal laptop and desktop browsers
- narrower tablet widths
- occasional mobile access is okay, but it is not the primary target

---

## Page Layout

## Recommended layout structure

Use a **dashboard grid of cards/sections**.

Suggested top-to-bottom structure:

1. **Page header**
2. **Health and status row**
3. **Budget and spending section**
4. **Fun Libs section**
5. **Calendar + weather section**
6. **VPS details section**

### Header contents

Include:

- page title: `Dashboard`
- current date/time
- last refreshed timestamp
- optional manual refresh button
- lightweight navigation back to landing page

### Layout behavior

For tablet landscape and desktop:

- use a 2-column or 3-column card grid depending on width
- cards should span different widths depending on importance
- most important cards should appear in the top area

For example:

- top row: health/status cards
- mid row: spending overview + BudgetTools recent runs
- lower row: Fun Libs, calendar, weather, VPS details

### Visual priority

These items should have the highest priority on the page:

1. BudgetTools run status
2. spending overview
3. Actual Budget status
4. website status (`albretsen.no`)

---

## Information Architecture

## Section 1: Overall service health

This is the “everything okay?” area.

### Required cards

- **BudgetTools**
- **Actual Budget**
- **albretsen.no**
- optionally one combined **System Health** card

### Card design expectations

Each health card should show:

- service name
- status: healthy / warning / error / unknown
- short human-readable status text
- last checked timestamp
- optional extra detail line

### Status colors

Use restrained status colors:

- green = healthy
- amber/yellow = warning/degraded
- red = error/down
- gray = unknown/no data

Do not flood the whole UI with aggressive status colors. Keep them contained to badges, dots, icons, or accent borders.

---

## Section 2: BudgetTools recent runs

This is one of the core pieces of the dashboard.

### Required content

Show the **3 latest BudgetTools runs**.

### For each run, include if available

- run timestamp
- overall result: success / partial / failed
- duration
- what steps were included
- which sources/accounts were processed
- short summary of outcome
- link to deeper logs/details if available

### Presentation recommendation

Use a single card called **Recent BudgetTools Runs** with a compact vertical list of the three latest runs.

Each run row/card should show:

- timestamp
- result badge
- one-line summary
- expandable detail area or small metadata lines if space allows

### Important UX point

This should be understandable at a glance. Avoid long logs in the main layout.

The most recent run should be visually emphasized.

### Recommended example states

- **Success**: “Completed successfully. 4 accounts processed.”
- **Partial**: “Finished with warnings. Amex skipped.”
- **Failed**: “Upload failed after extraction.”

---

## Section 3: Spending overview

Use data based on:

`https://budget.albretsen.no/reports/spending/c7c77244-f5b9-47b8-9f5c-de687871b108`

### Goal

Present a quick overview of current spending in a dashboard-friendly format.

### Frontend expectations

The frontend developer should not simply iframe the whole report unless that turns out to be the only practical option.
The preferred solution is to show a **clean summary view** extracted from backend-provided data.

### Required content

At minimum show:

- total spending for relevant current period
- major categories
- category breakdown
- top categories by amount
- optional month-over-month or budget-vs-actual indicators if data is available

### Presentation recommendation

Use one larger card called **Spending Overview**.

Preferred visual pattern:

- summary totals at top
- category list beneath
- optional simple bar visualization

### Important implementation note

Because this is running on a Raspberry Pi tablet, prefer:

- simple CSS bars
- lightweight SVG
- minimal chart dependencies

Avoid heavy dashboards with large JS chart bundles if the same information can be shown in a simpler way.

---

## Section 4: Actual Budget status

The dashboard should show whether **Actual Budget on the VPS is running as expected**.

### Required content

Show:

- service status: up/down/degraded/unknown
- last successful sync or health check if available
- URL or quick link if appropriate
- short detail text when unhealthy

### Suggested signals

Examples of data that may be surfaced via backend/collector:

- container running state
- HTTP health check result
- response time
- last successful application availability check

### UX expectation

This should be a clear health card, not a deep monitoring page.

---

## Section 5: albretsen.no status

The dashboard should show whether the main website is running as expected.

### Required content

Show:

- status of `albretsen.no`
- optional status of `dev.albretsen.no`
- response time if available
- last checked timestamp
- error message/summary if not healthy

### Suggested presentation

Either:

- separate card for `albretsen.no`
- or combined website status card showing both production and dev

If both are shown, production should have higher visual priority than dev.

---

## Section 6: VPS overview

Show important VPS details, but keep this focused.

### Required content

Surface only high-signal information such as:

- CPU load
- memory usage
- disk usage
- uptime
- Docker/container overview summary
- network/public IP only if useful and safe
- temperature only if relevant/available

### Avoid

Do not turn this into a noisy sysadmin screen with too many metrics.

Avoid:

- giant logs
n- raw command output
- every single container detail in the main view
- low-value metrics that do not help actionability

### Presentation recommendation

Use one **VPS Overview** card with compact metric tiles inside it.

Potential tile examples:

- CPU
- RAM
- Disk
- Uptime
- Containers healthy / total

Use simple sparklines only if they are very lightweight and genuinely helpful.

---

## Section 7: Fun Libs overview

The dashboard should show useful data from the Fun Libs app.

Primary source mentioned:

- Supabase project: `eslrohuhvzvuxvueuziv`

Optional source:

- Google Play Console, if practical

### Required content direction

This section should answer: “How is Fun Libs doing?”

### Good candidate metrics

From Supabase, show things like:

- total users
- active users (if derivable)
- recent signups
- generated content count / stories created / app events, depending on schema
- recent activity trend
- errors or failed jobs if relevant and available

### Optional Play Console additions

Only include if it is reasonably achievable and stable:

- installs
- active devices/users
- crash or rating summary
- release/version snapshot

If Play Console integration is too painful, the document should treat it as **phase 2 / optional**.

### Presentation recommendation

Use a **Fun Libs** card or section with:

- 3–6 top-level metrics
- one recent activity summary
- optional trend indicator

This should not try to expose the entire Supabase backend.

---

## Section 8: Calendar events

The dashboard may use GOG to show calendar events for the current day.

### Required content

Show today’s events:

- start time
- title
- optional location
- optional all-day indicator

### UX behavior

If there are no events:

- show a calm empty state like “No calendar events today”

### Presentation recommendation

Use a simple **Today** or **Calendar** card.

This should be a lightweight agenda list, not a full calendar UI.

---

## Section 9: Weather for Bergen

Show current weather for Bergen.

### Required content

Include:

- current temperature
- condition summary
- high/low for the day if available
- precipitation/rain indication if useful
- wind if useful

### Presentation recommendation

Use a compact **Weather** card.

This should be readable in one glance and fit naturally beside calendar information.

---

## Data and System Architecture Requirements

The user explicitly wants Docker Compose to run the website and supporting services.

## Docker Compose expectation

A `docker-compose` setup should be used to run:

- the main website (`albretsen.no`)
- `dev.albretsen.no`
- any collectors/services needed to gather data for the dashboard

### Frontend developer does not need to build the whole infrastructure alone

But the frontend design/spec should assume the system will include:

- the frontend site/app
- one or more backend/collector services
- scheduled fetchers or health-check collectors where needed
- possible cache/storage layer if useful

### Architecture recommendation

Prefer this structure:

1. **Frontend app**
   - serves landing page and dashboard route
   - fetches already-prepared dashboard data from an internal API

2. **Dashboard API / aggregator service**
   - normalizes data from different sources
   - returns one stable dashboard payload for the frontend

3. **Collectors / scheduled jobs**
   - fetch/refresh data from BudgetTools, Actual, site health, Supabase, calendar, weather, etc.
   - can run on intervals

This is better than making the frontend directly query many external services.

---

## Strongly Recommended Data Flow

The frontend should consume a single endpoint such as:

- `GET /api/dashboard`

That endpoint should return a normalized payload for all widgets/sections.

### Why this is important

This avoids:

- lots of frontend API complexity
- exposing secrets to the browser
- inconsistent loading states across many providers
- rate limit pain
- tight coupling between UI and external systems

### Suggested dashboard payload shape

The exact schema is up to implementation, but it should conceptually include:

- `generatedAt`
- `services`
- `budgetTools`
- `spending`
- `vps`
- `funLibs`
- `calendar`
- `weather`

The frontend should be built against a clean, stable UI-oriented schema.

---

## Refresh Strategy

Because this dashboard is often displayed passively on a tablet, it should refresh automatically.

### Recommended approach

- auto-refresh every **2 to 5 minutes** for health/system info
- slower refresh cadence for heavier or less time-sensitive data
- allow manual refresh in UI

### Suggested freshness targets

- service health: every 1–5 minutes
- VPS stats: every 1–5 minutes
- weather: every 15–30 minutes
- calendar: every 5–15 minutes
- spending and BudgetTools history: every 5–15 minutes unless run-triggered
- Fun Libs metrics: every 5–30 minutes depending on source cost

### Important requirement

Show **last updated** / data freshness in the UI so stale data is visible.

---

## Loading, Empty, and Error States

This matters a lot. A dashboard with partial data should still be useful.

### Required frontend behavior

Each section/card should support:

- loading state
- success state
- empty state
- stale state
- error state

### Examples

- BudgetTools unavailable -> show warning card, not whole-page failure
- weather API failed -> weather card shows fallback text
- Supabase metrics unavailable -> Fun Libs card shows “Data unavailable” with timestamp

### Whole page behavior

The page should never become blank because one source failed.

---

## Design System and Visual Guidance

## Visual style direction

Use the existing site style as a base, but adapt it for dashboard readability.

### Recommended characteristics

- medium-to-large text for critical numbers
- crisp card spacing
- limited palette with strong contrast
- subtle shadows or borders
- clean iconography where helpful
- restrained status coloring

### Typography

Important status info should be readable from a slight distance on an 11-inch display.

Recommendations:

- clear hierarchy between section title, primary value, and metadata
- avoid tiny metadata text
- avoid long paragraphs

### Cards

Cards should:

- have consistent padding and radius
- be reusable components
- support title, status badge, main content, footer/meta area
- work with sparse and dense content

### Responsive behavior

At tablet landscape widths:

- use a compact multi-column grid
- do not force desktop-wide empty whitespace

At smaller widths:

- stack cleanly
- preserve content priority

---

## Accessibility Requirements

Even though this is a personal dashboard, it should still be properly built.

### Required

- sufficient color contrast
- status not conveyed by color alone
- keyboard-accessible navigation
- semantic headings/landmarks
- readable focus states
- screen-reader-friendly labels for status and refresh controls

---

## Performance Requirements

This matters because the main display device is modest.

### Required frontend constraints

- keep bundle size under control
- avoid heavy component/charting libraries unless needed
- avoid unnecessary re-renders
- minimize animated transitions
- prefer server-side aggregation over browser-side orchestration

### General principle

The dashboard should feel stable and lightweight when left open for long periods.

---

## Security and Secrets

The frontend must not expose sensitive credentials.

### Important requirement

Any credentials/tokens required for:

- Supabase
- Google Calendar/GOG
- weather provider
- monitoring endpoints
- Play Console
- internal status checks

must be handled server-side or in collector services, **not in browser-exposed code**.

### Frontend assumption

The frontend should only call internal API endpoints that return sanitized data.

---

## Suggested Component Breakdown

The frontend developer should create reusable dashboard components.

### Suggested components

- `DashboardPage`
- `DashboardHeader`
- `DashboardGrid`
- `StatusCard`
- `MetricCard`
- `MetricTile`
- `RunListCard`
- `SpendingOverviewCard`
- `CalendarCard`
- `WeatherCard`
- `FunLibsCard`
- `VpsOverviewCard`
- `LastUpdatedBadge`
- `RefreshButton`
- `EmptyState`
- `ErrorState`

### Important note

Do not make each section a totally custom layout if the same card patterns can be reused.

---

## Suggested Route and Page Behavior

### Route

- `/dashboard`

### Document title

- `Dashboard | albretsen.no`

### Page behavior

- dashboard should load quickly with placeholders/skeletons
- data should populate card-by-card if needed
- support manual refresh
- support auto-refresh
- preserve stable layout while data updates

Avoid large layout shifts during refresh.

---

## Suggested Content Priority on First View

When the page first loads on the tablet, the visible above-the-fold area should ideally include:

- Dashboard title / timestamp
- BudgetTools latest status
- Actual Budget status
- albretsen.no status
- spending summary

Everything else can be below or alongside depending on screen width.

---

## Suggested Phasing

## Phase 1 — Core dashboard

Must include:

- route and navigation
- overall layout
- BudgetTools latest 3 runs
- spending overview
- Actual Budget status
- albretsen.no status
- VPS overview
- calendar events
- Bergen weather
- reusable card system
- loading/empty/error states

## Phase 2 — Product metrics expansion

Add:

- richer Fun Libs metrics from Supabase
- trend indicators
- historical comparisons
- optional dev site health details

## Phase 3 — Optional integrations

Only if practical:

- Google Play Console metrics
- deeper drill-down views
- event-based refreshes / push updates

---

## Open Questions the Developer/Project Should Resolve Early

These should be clarified before implementation goes too far:

1. **What exact source provides the 3 latest BudgetTools runs?**
   - logs
   - DB
   - JSON artifact
   - API

2. **How should spending data be obtained from the Actual/Budget reporting URL?**
   - direct API
   - scraped report
   - precomputed backend export

3. **What defines “Actual Budget is running as expected”?**
   - container up
   - HTTP 200
   - usable login page
   - actual sync behavior

4. **What defines “albretsen.no is running as expected”?**
   - homepage reachable
   - response time threshold
   - content check

5. **Which VPS metrics are actually most important?**
   - CPU/RAM/disk/uptime likely, but confirm

6. **What Fun Libs metrics matter most?**
   - users
   - generated stories
   - DAU/WAU
   - subscriptions
   - errors

7. **Is Play Console worth the integration complexity?**
   - probably optional unless there is already access tooling in place

8. **Should the dashboard require authentication?**
   - highly recommended if any private operational data is exposed

---

## Strong Recommendation on Authentication

This dashboard is operational and personal in nature.
It likely should **not** be a fully public page if it exposes:

- service health
- VPS stats
- private spending summaries
- Fun Libs internal metrics
- calendar data

### Recommendation

Protect `/dashboard` behind authentication.

Even a simple private access layer is better than leaving operational/personal data public.

If the dashboard is intended to be public, then the content scope must be reduced significantly.

---

## Deliverables Expected from the Frontend Developer

The frontend developer should produce:

1. A new route/page at `/dashboard`
2. Navigation path from landing page to dashboard
3. Reusable dashboard card/layout components
4. Responsive layout optimized for 11-inch tablet and desktop
5. UI for all required dashboard sections
6. Loading, empty, stale, and error states per section
7. Integration against a normalized internal dashboard API payload
8. A design that fits the existing `albretsen.no` visual identity

---

## Concise Build Brief for the Frontend Developer

Build a new `albretsen.no/dashboard` page as part of the existing site.
It should be a clean, responsive personal operations dashboard optimized primarily for an 11-inch Raspberry Pi tablet in landscape, but also work well on desktop browsers.

The page should surface:

- 3 latest BudgetTools runs
- spending overview from the provided budget report source
- Actual Budget health
- `albretsen.no` health
- important VPS details
- Fun Libs data from Supabase
- today’s calendar events
- Bergen weather

Use reusable card-based UI components, keep performance lightweight, and assume the frontend consumes a single normalized internal dashboard API rather than talking directly to all external services.
Docker Compose should be the orchestration model for the website(s) and supporting collectors/services.
Authentication for the dashboard is strongly recommended.
