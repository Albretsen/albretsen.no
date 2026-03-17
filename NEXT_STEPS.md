# NEXT_STEPS.md

## Highest-priority tasks

1. Implement `/dashboard` route using the design document. ✅
2. Add navigation from the landing page to `/dashboard`. ✅
3. Build reusable dashboard layout/card components. ✅
4. Add placeholder/mock-backed sections for:
   - BudgetTools recent runs ✅ first live wiring from `/opt/BudgetTools/runs`
   - Spending overview ✅ live snapshot from Actual budget blob on disk
   - Actual Budget status ✅ first live health check via `https://budget.albretsen.no`
   - albretsen.no status ✅ first live health checks for prod + dev
   - VPS overview ✅ first live host metrics
   - Fun Libs overview
   - Calendar ⚠️ GOG wiring improved, but live data is blocked by an expired/revoked Google token
   - Weather ✅ live via swappable provider layer with Open-Meteo as the first provider
5. Validate responsive behavior for 11-inch tablet landscape and desktop.
6. Document the expected API/data contract for real integrations.
7. Replace Fun Libs placeholder with a real source, or explicitly defer it.
8. Reduce noisy/raw error text in blocked cards like Calendar while keeping them honest.
9. Consider mirroring BudgetTools runner semantics in the source script too, since it currently leaves stale `status: running` on failed runs.

## How to pick work
Always do the highest-priority unfinished task that is unblocked.
If a task is blocked, move it to `BLOCKERS.md` and stop if human input is required.
