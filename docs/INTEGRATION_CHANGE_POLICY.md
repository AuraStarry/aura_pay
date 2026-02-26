# INTEGRATION_CHANGE_POLICY.md — Integration Doc Maintenance Policy

## Why
Aura Pay is a shared payment capability for multiple products. Any API/schema change can break downstream integrations.

This policy defines how integration docs must be maintained.

## Change Levels

## L1 — Non-breaking internal change
Examples:
- internal refactor
- log/monitoring only

Required:
- no integration doc update needed
- but verify `docs/INTEGRATION_API.md` still accurate

## L2 — Backward-compatible integration change
Examples:
- add optional field
- add new endpoint
- add new status enum value (non-breaking)

Required updates in same PR/commit set:
1. `docs/INTEGRATION_API.md`
2. If deployment impact: `docs/DEPLOY_CHECKLIST.md`
3. Update `PROJECT.md` status summary

## L3 — Breaking integration change
Examples:
- rename/remove endpoint
- required field changes
- response contract incompatible change
- schema/semantic change impacting existing integrators

Required updates in same PR/commit set:
1. `docs/INTEGRATION_API.md`
2. `docs/DEPLOY_CHECKLIST.md` (migration/rollback section)
3. Add a **Breaking Change Notice** section in README
4. Update `PROJECT.md` with migration note

## Mandatory Rule (Always)

Any change touching below paths must include integration-doc review in the same session:
- `app/api/**`
- `schema.sql`
- `sql/*.sql`

Minimum checklist before push:
- [ ] INTEGRATION_API reflects current request/response contract
- [ ] error codes/examples still valid
- [ ] deployment checklist still matches runtime needs

## Version Tagging (Lightweight)

Add a doc version header in `docs/INTEGRATION_API.md`:
- format: `Integration Contract Version: vYYYY.MM.DD-N`
- bump when L2/L3 changes happen

## Ownership

Primary owner: Aura (this agent)

Operational commitment:
- After any API/schema change, proactively update integration docs before final push.
- If not updated, treat as incomplete task.
