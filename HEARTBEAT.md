# HEARTBEAT.md

On each heartbeat:

1. Read `PROJECT.md`, `NEXT_STEPS.md`, `BLOCKERS.md`, and this file.
2. If there is an unfinished highest-priority unblocked task, resume work on it.
3. If the last run appears to have been interrupted, aborted, or stopped mid-task, resume from the last sensible step instead of waiting silently.
4. Keep changes small and reviewable.
5. Update `NEXT_STEPS.md` and `BLOCKERS.md` as progress changes.
6. If meaningful work was completed previously but not reported yet, send one concise milestone update and wait.
7. Stop immediately if blocked by missing credentials, unclear decisions, approvals, risky actions, or missing access.
8. When blocked, send exactly one concise Discord message containing:
   - the blocker
   - what decision/input is needed
   - recommended option
   - 1-2 alternatives
9. Do not continue until the human replies.
10. If nothing needs attention, reply exactly `HEARTBEAT_OK`.

Notes:
- Do not invent new goals.
- Do not repeat old blocker messages if still waiting for a reply.
- Prefer lightweight checks over expensive repeated scans.
- If a task is already in progress, prefer continuing it over switching context.
