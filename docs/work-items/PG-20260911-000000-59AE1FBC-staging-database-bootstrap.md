# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260911-000000-59AE1FBC
- **Title:** Staging-safe database bootstrap command
- **Status:** VERIFIED
- **Human owner:** chong
- **Requested by:** chong
- **Sanitized original request:** Add a staging-safe database bootstrap command.
- **Target date:** 11 September 2026
- **Risk class:** R3
- **Autonomy ceiling:** A2 for workspace edits; staging database execution remains human-controlled.
- **Required approvers:** Human product/security owner approved the plan in chat.

## Business outcome

- **Problem/opportunity:** The development-only full seed runner rejects staging, while staging needs baseline roles and reference data.
- **Expected user/business outcome:** A staging database can be initialized without demo catalog records, sample customer data, development users, or live-integration routing data.
- **Affected personas/roles:** system
- **Success measure:** The command succeeds only with an explicit staging acknowledgement and creates no mutable operational fixtures.

## Scope

### In scope

- Add `db:bootstrap:staging`.
- Initialize idempotent lookup, geography, document-type, RBAC, lead-source, and system-settings baseline records.
- Reject any environment other than `staging` and require a human-supplied acknowledgement.

### Explicitly out of scope

- Production migration or seed execution.
- Demo projects/units, sample leads/documents/events, development admin accounts, and WhatsApp queues/routing.
- Authentication, authorization, schema, or permission-policy changes.

## Requirements

| ID | Requirement | Priority | Source/owner |
| --- | --- | --- | --- |
| `REQ-001` | Bootstrap only staging databases with an explicit acknowledgement. | Must | chong |
| `REQ-002` | Exclude demo and sample operational data. | Must | chong |
| `REQ-003` | Preserve the existing development-only full seed command. | Must | repository behavior |

## Acceptance criteria

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| `AC-001` | A staging database URL and `APP_ENV=staging` | `db:bootstrap:staging` has acknowledgement | Baseline reference/RBAC/configuration data is initialized idempotently. | Manual staging command |
| `AC-002` | Any non-staging environment or omitted acknowledgement | The command runs | It stops before database mutation. | Code review/typecheck |
| `AC-003` | A new staging database | The command completes | No demo project, development admin, sample lead, booking/document sample, or WhatsApp queue/routing records are created. | Manual table review |

## Data classification

- **Data used:** Internal static reference data only.
- **PII or uploaded documents involved:** No.
- **Synthetic fixture plan:** No customer or sample operational records are created.
- **Model-visible data:** No real environment values or database contents.

## Risk and controls

| Calculator pass | Request/file manifest | Score | Risk | Matched rule IDs | Decision/gate |
| --- | --- | --- | --- | --- | --- |
| Request-only | staging bootstrap request | 30 | R2 | none | guarded-auto baseline |
| Proposed files | `package.json`, `src/db/seeds/bootstrap-staging.ts`, this work item | 60 | R3 | `BR-CTRL-001` | human plan approval recorded |
| Final manifest | `package.json`, `src/db/seeds/bootstrap-staging.ts`, `src/db/seeds/staging-bootstrap.ts`, this work item | 60 | R3 | `BR-CTRL-001` | approval recorded; staging execution is human-controlled |

- **Failure modes and blast radius:** Wrong database URL; mitigated by staging-only and acknowledgement guards. Baseline writes are idempotent.
- **Threat/abuse cases:** Accidental production initialization; non-staging environments fail before connection/mutation.
- **Prohibited actions:** Production execution, real data use, role-policy expansion, and secret handling.
- **Residual risks requiring acceptance:** Human must verify the target Supabase project before running the command.

## Delivery plan

- **Implementation approach:** Reuse existing idempotent seed functions with a new allowlist runner.
- **Agent/file ownership:** Agent owns the listed files only.
- **Rollout/staging:** Human executes against the isolated Supabase staging database after reviewing the command.
- **Rollback or forward-fix:** Records use idempotent upserts. If incorrect target database is selected, stop and restore/delete only under human-led incident handling.

## Verification plan

| Test ID | Requirement/Invariant | Level | Positive/negative/concurrent case | Expected evidence |
| --- | --- | --- | --- | --- |
| `TEST-001` | `REQ-001`, `REQ-002` | Static/typecheck | Verify staging and acknowledgement guards precede seed execution. | Typecheck and review |
| `TEST-002` | `REQ-003` | Regression | Existing `db:seed` is unmodified. | Diff review |

| Check | Planned environment | Required outcome / N/A reason |
| --- | --- | --- |
| `git diff --check` | Workspace | Pass |
| Scope review against declared manifest | Workspace | Pass—independent read-only review found no production or fixture-data route. |
| `npm run typecheck` | Workspace | Pass |
| `npm run test` | Workspace | Pass—19 files, 99 tests. |
| `npm run build` | Workspace | Pass |
| `npm run sdlc:validate` | Workspace | Pass—44 base rules valid. |
| `npm run test:sdlc` | Workspace | Pass—33 tests. |
| `npm ci`, formatting, lint, audit | Clean CI | N/A—no clean checkout CI provisioned; existing baseline failures are documented in session context. |
| Staging bootstrap smoke | Supabase staging, human executed | Pending—requires confirmed staging database target. |

## Questions and assumptions

| Item | Question or assumption | Owner | Due/decision |
| --- | --- | --- | --- |
| 1 | Human verifies that `DATABASE_URL` belongs to `propertygojb-staging` before execution. | chong | Before staging bootstrap |

## Ready approval

- **Product owner:** chong
- **Technical/security/privacy approver(s):** chong
- **Approved scope/risk/autonomy:** R3 staging-only bootstrap as described; approval received in chat.
- **Approval evidence:** `Approved: add a staging-safe database bootstrap command.`
- **Date:** 11 September 2026