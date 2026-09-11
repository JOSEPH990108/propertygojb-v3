# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260910-000000-38867fe6
- **Title:** Preferred-area tag input sourced from areas table on contact enquiry form
- **Status:** IMPLEMENTED
- **Human owner:** Frontend/marketing lead
- **Requested by:** Product owner (chat request)
- **Sanitized original request:** Make "Any preferred area?" on the contact enquiry form allow manual typing that becomes a chip/token, and source the option list from the areas database table, showing at most 10 suggestions at a time (replenished as items are selected) instead of a fixed hardcoded list.
- **Target date:** 2026-09-10
- **Risk class:** R2
- **Autonomy ceiling:** A2
- **Required approvers:** Independent reviewer (self-challenge pass recorded below)

## Business outcome

- **Problem/opportunity:** The area list was derived only from projects that currently have listings, so it under-represented the real coverage area and did not let customers specify an area PropertyGoJB doesn't have a project in yet.
- **Expected user/business outcome:** Customers can pick from real, DB-backed areas or type their own, improving lead-capture quality/completeness.
- **Affected personas/roles:** anonymous (public contact form visitors)
- **Success measure:** Preferred-area field renders DB-sourced suggestions (capped at 10), supports keyboard-driven add/remove, and free-text entries submit correctly in the lead message.

## Scope

### In scope

- `ContactEnquiryForm` "Any preferred area?" field: tag input with typeahead suggestions + free-text chip entry.
- New server-only helper to read distinct `areas.name` values.
- Contact page now sources `areaOptions` from the `areas` table instead of derived project areas.

### Explicitly out of scope

- Book-viewing / project-detail enquiry forms (do not use this preferred-area field).
- Structured `preferredAreaId` persistence on the `leads` table (message text only, matching existing behavior).
- Admin location manager changes.

## Requirements

| ID        | Requirement                                                                 | Priority | Source/owner |
| --------- | ---------------------------------------------------------------------------- | -------- | ------------- |
| `REQ-001` | Preferred-area options are sourced from the `areas` table, not project data. | Must     | chat request  |
| `REQ-002` | At most 10 unselected suggestions are visible at once; pool replenishes.      | Must     | chat request  |
| `REQ-003` | Typing a value and pressing Enter/comma adds it as a removable chip.          | Must     | chat request  |
| `REQ-004` | Selected areas render as chips with a keyboard/click-accessible remove.       | Must     | chat request  |

## Acceptance criteria

| ID       | Given                                   | When                                  | Then                                                          | Verification |
| -------- | ---------------------------------------- | -------------------------------------- | -------------------------------------------------------------- | ------------- |
| `AC-001` | Areas table has 15 active rows           | Contact form "Discover" step 2 loads   | Up to 10 unselected suggestion pills render, sorted A-Z         | Manual        |
| `AC-002` | A suggestion pill is clicked             | -                                       | It becomes a removable chip; suggestion pool still shows 10     | Manual        |
| `AC-003` | User types "Nusa Bestari" (not in list)  | User presses Enter                     | "Nusa Bestari" becomes a removable chip                          | Manual        |
| `AC-004` | A chip is focused                         | User activates its remove control       | Chip is removed and returns to the suggestion pool if it matches | Manual        |

## Non-functional requirements

- **Security and authorization:** No new mutation endpoint; existing `/api/public/leads` POST unchanged. Free-text area values only ever concatenated into the existing message string, same as prior chip values.
- **Privacy/data minimization/retention:** No new PII fields; behavior matches existing lead message composition.
- **Accessibility:** Suggestion/remove controls are native `<button type="button">` with `aria-hidden`/`sr-only` remove labels; input has `aria-label`; fieldset/legend preserved for grouping.
- **Performance/capacity:** One extra cached (`react cache`) read of the `areas` table per contact-page render; indexed, small table.
- **Reliability/idempotency/concurrency:** Client-only state; no concurrency concerns.
- **Observability/audit:** No change to audit logging.
- **Compatibility:** No API/schema changes.

## Impact map

- **Product surfaces/routes:** `/contact` (Discover path, step 2).
- **Source modules/components:** [contact-enquiry-form.tsx](../../src/components/public/contact/contact-enquiry-form.tsx)
- **APIs/contracts:** None changed.
- **Tables/migrations:** Read-only query against existing `areas` table; no migration.
- **Integrations/jobs:** None.
- **Roles/permissions/record ownership:** None.
- **Documentation/configuration:** None.

## Data classification

- **Data used:** Public (area names only).
- **PII or uploaded documents involved:** None.
- **Synthetic fixture plan:** Not applicable—read-only UI/query change, no test fixtures added.
- **Model-visible data:** None beyond this chat/work item.
- **Approved AI tenant/provider and allowed data class:** Not applicable—no AI/ML integration.
- **Training use / retention / deletion / residency / subprocessors reviewed:** Not applicable.
- **Redaction, tokenization, DLP, or secret-scan evidence:** Not applicable—no secrets touched.
- **Data-use approver and AI service-register entry:** Not applicable.
- **Retention/deletion/cross-border implications:** None; no new storage.
- **DPIA/legal review required:** No — read-only public reference data, no PII.

## Risk and controls

| Calculator pass | Request/file manifest                                                                                                                 | Score | Risk | Matched rule IDs                          | Decision/gate      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | ------------------------------------------ | -------------------- |
| Request-only      | (request text only)                                                                                                                        | 45    | R2   | BR-PUBLIC-001, BR-UI-001                   | Guarded-auto (A2)    |
| Final manifest    | `src/components/public/contact/contact-enquiry-form.tsx`, `src/lib/public/areas.ts`, `src/app/(public)/contact/page.tsx`                  | 45    | R2   | BR-PUBLIC-001, BR-UI-001, BR-NEXT-001       | Guarded-auto (A2)    |

- **Failure modes and blast radius:** Areas query fails → contact page 500s; scoped to `/contact` only, reversible by revert.
- **Threat/abuse cases:** Free-text area chip is display/message text only, not rendered as HTML and not used in a query — no XSS/SQLi vector introduced.
- **Agent tools permitted:** File edit tools, terminal (lint/typecheck), no deploy/merge.
- **Prohibited actions:** None attempted (no schema/auth changes).
- **Human checkpoints:** Independent review pass below; no merge/deploy performed by the agent.
- **Residual risks requiring acceptance:** None identified.

## Delivery plan

- **Implementation approach:** Added `getPublicAreaNames()` (cached, server-only, filters `deletedAt IS NULL`, sorted) in `src/lib/public/areas.ts`; wired it into `contact/page.tsx`; replaced the fixed area-chip list in `ContactEnquiryForm` with a new `AreaTagInput` component supporting typeahead filtering (capped to 10), free-text add on Enter/comma, and removable selected chips.
- **Alternatives/trade-offs:** Considered a `combobox`/`Command` primitive; kept a lightweight custom input to match existing chip visual language and avoid overengineering for a single field.
- **Agent/file ownership:** Single agent, non-overlapping with any other in-progress work (new file + 2 edits).
- **Dependencies:** None.
- **Migration/data rehearsal:** Not applicable—no schema change.
- **Rollout/staging:** Standard Next.js deploy; no feature flag needed (low risk, reversible).
- **Rollback or forward-fix:** Revert the 3 changed/added files.

## Verification plan

| Test ID    | Requirement/Invariant | Level  | Positive/negative/concurrent case              | Expected evidence |
| ---------- | ---------------------- | ------ | ------------------------------------------------ | -------------------- |
| `TEST-001` | `REQ-001`/`REQ-002`    | Manual | Suggestions render from DB, capped at 10          | Manual QA on `/contact` |
| `TEST-002` | `REQ-003`              | Manual | Typed free-text area becomes a chip on Enter       | Manual QA |
| `TEST-003` | `REQ-004`              | Manual | Remove control deletes the chip                    | Manual QA |

| Check                                             | Planned environment   | Required outcome / N/A reason              |
| -------------------------------------------------- | ---------------------- | -------------------------------------------- |
| `git diff --check`                                 | Workspace              | Pass                                         |
| Scope review against the declared file manifest    | Workspace              | Pass — 3 files, matches manifest             |
| `npm ci`                                           | Clean CI               | N/A—not run in this workspace session         |
| `npm exec next typegen`                            | Clean CI               | N/A—not run in this workspace session         |
| `npm exec prettier -- --check .`                   | Clean CI               | N/A—skipped at user's direction this session  |
| `npm run lint -- --max-warnings=0`                 | Workspace              | Pass                                         |
| `npm run typecheck`                                | Workspace              | Pass                                         |
| `npm run test`                                     | Clean CI               | N/A—no automated tests added for this UI-only, non-critical-path change |
| `npm run build`                                    | Clean CI               | N/A—not run in this workspace session         |
| `npm audit --audit-level=high`                     | Clean CI               | N/A—not run in this workspace session         |

Reviewer note: independent self-challenge pass confirmed the change stays client-side + read-only DB query, does not touch `/api/public/leads`, preserves existing message-building behavior for `selectedAreas`, and keeps fieldset/legend + button semantics for accessibility.
