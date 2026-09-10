# PropertyGoJB AI Session Context

**Purpose:** Durable, version-controlled memory for every coding-agent session.  
**Last reviewed:** 4 September 2026  
**Authority:** This summary routes agents to evidence; source code, migrations, tests, and the active rule registry remain authoritative.

## Start every change request here

1. Read `AGENTS.md` and `.github/copilot-instructions.md`.
2. Preserve the current branch, dirty worktree, and unrelated/untracked files.
3. Run `npm run sdlc:score -- --request "<user request>"` before any repository mutation.
4. Investigate the relevant UI → route → guard → domain logic → database → audit/integration path.
5. Re-run the score with the proposed file list before implementation.
6. Load the matched rule IDs from `docs/sdlc/business-rules.json`.
7. Follow the gates returned by the calculator and the workflow in the `propertygojb-agentic-sdlc` skill.

The calculator is triage support, not permission. Code evidence or a protected path can raise risk. An agent may never lower the calculated class without a documented human decision.

## Product and architecture map

- **Public/customer surface:** project discovery, availability, enquiries, viewing requests, profiles, bookings, consented marketing.
- **Agent surface:** assigned leads/customers, follow-ups, appointments, properties, bookings, documents, reports.
- **Admin surface:** users/roles, agents, project catalog/content/imports, inventory, CRM, bookings/payments/documents, reporting, settings.
- **Stack:** Next.js App Router 16.2.9, React 19.2.4, strict TypeScript, PostgreSQL/Drizzle, Better Auth, Zod, Vitest, Tailwind/shadcn.
- **External services:** Ably, Nominatim/OpenStreetMap, consent-gated marketing providers, and in-progress WhatsApp Cloud API ingestion.
- **Runtime AI boundary:** no production LLM/agent runtime exists. WhatsApp V1 is deterministic. Coding-agent automation must not be confused with customer-facing AI.

## Non-negotiable domain memory

- Re-authorize role and record ownership at every protected mutation boundary (`BR-AUTH-001`).
- Public registration creates CUSTOMER identities only; privileged role changes are human-controlled (`BR-AUTH-002`, `BR-ROLE-001`).
- OTP challenges remain purpose/phone/user bound, time limited, attempt limited, and transactionally consumed for identity changes (`BR-OTP-001`).
- Draft, scheduled, and published project visibility is controlled only by the project-content workflow (`BR-PROJECT-001`, `BR-PROJECT-002`).
- An authenticated customer may link or update only CRM records that belong to the verified identity (`BR-CUSTOMER-001`, `BR-PROFILE-001`).
- A requested viewing is not a confirmed appointment; Malaysia time and slot rules are server-enforced (`BR-VIEW-001`).
- Lead claims, unit reservations, booking/payment transitions, and releases require atomicity, idempotency, and audit evidence (`BR-LEAD-001`, `BR-BOOK-001`–`BR-BOOK-003`, `BR-PAY-001`).
- Uploaded customer documents are restricted, never model input, and require authorization, clean-scan gating, access audit, and human-only approval/rejection (`BR-DOC-001`–`BR-DOC-003`).
- Real customer data, documents, OTPs, credentials, and raw conversations are never retrieved into a coding-agent session; use synthetic or redacted substitutes (`BR-AI-DATA-001`, `BR-AI-DATA-002`).
- Meaningful business mutations use the operational audit trail; high-volume page views use consented analytics instead (`BR-AUDIT-001`).
- Marketing scripts and attribution remain absent until consent and are revoked on denial (`BR-CONSENT-001`).
- WhatsApp inbound requires signature verification and provider-event deduplication. Outbound customer messaging is not autonomous (`BR-WA-001`, `BR-WA-002`).
- Schema/migration, agent-control, dependency, secret, destructive, and production actions use their protected gates (`BR-DB-001`, `BR-CTRL-001`, `BR-SECRET-001`, `BR-DESTROY-001`).
- Pull-request approval/merge and pushes to default or protected branches stay human-executed (`BR-SCM-001`).

## Known enforcement gaps—do not mistake targets for current behavior

- Local route type generation, typecheck, 90 tests, and the production build pass. Lint still has a pre-existing `prefer-const` failure, and the full-repository Prettier baseline reports 288 existing/out-of-scope files; clean-checkout CI is not established.
- The current dependency audit reports 10 high and 5 moderate findings, including Next.js and Better Auth advisories. Do not run an unreviewed `npm audit fix`; remediation needs its own dependency/security work item.
- No committed CI/CD pipeline, CODEOWNERS, protected-branch configuration, deployment runbook, or configured browser/integration test suite is visible yet.
- Lead claim and booking creation require stronger concurrency guarantees; project import needs transactional/preview-binding hardening.
- Fine-grained permissions and two-person approval tables exist but are not broadly enforced at runtime. The current role endpoint requires a SUPER_ADMIN policy decision.
- Document storage/scanning/access logging is not production-complete; local uploads and `PENDING` scan handling must not be treated as safe AI input.
- API authorization/error behavior, mutation/auth/document audit coverage, typed environment validation, and operational telemetry remain incomplete.
- WhatsApp webhook work is active and untracked in the current worktree; preserve it. Durable queue/retry/outbound policy is not implemented.

## Persistent business-rule learning

`docs/sdlc/business-rules.json` is the canonical rule memory. Each active rule has a stable ID, risk floor, evidence, validation expectations, and enforcement status.

- Never silently convert an inference into an active rule.
- When the user states a potentially durable rule, record it in the work item as a **rule candidate** with the exact statement and evidence.
- Ask one confirmation only when permanence or meaning is genuinely ambiguous.
- Promotion to an active learned rule is an R3 control-plane change requiring human approval, source evidence, owner, review date, and tests.
- Proposed learned rules may be retained for review but do not affect scoring or implementation until `status` is `active`.
- Retire or supersede stale rules; do not delete their history.

## Validation baseline

The full target clean-CI matrix is in `docs/AI_AGENTIC_SDLC.md`. Every check is recorded as `Pass`, `Fail`, or `N/A—reason`; only the accountable reviewer accepts N/A. Use version-matched guidance in `node_modules/next/dist/docs/` before changing Next.js behavior.
