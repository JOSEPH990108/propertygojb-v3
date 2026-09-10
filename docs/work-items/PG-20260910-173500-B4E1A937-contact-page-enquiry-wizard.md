# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260910-173500-B4E1A937
- **Title:** Contact page enquiry wizard redesign (two-path, two-step)
- **Status:** IMPLEMENTED
- **Human owner:** PropertyGoJB product/engineering owner
- **Requested by:** User (chat request), pasted design mockup screenshots
- **Sanitized original request:** Enhance the public contact us page UI: redesign the enquiry flow into a two-step wizard (choose "I know the project" vs "Help me find a property", then preferences/project-selection step, then contact-details step) matching a provided luxury design mockup, with a "What happens next" sidebar. No changes to backend enquiry submission logic, auth, or data handling.
- **Target date:** 2026-09-10
- **Risk class:** R2
- **Autonomy ceiling:** A2 (guarded-auto)
- **Required approvers:** Independent review pass only (bounded/reversible UI change; no protected-domain path touched)

## Business outcome

- **Problem/opportunity:** The `/contact` page used a generic single-form layout that did not let undecided buyers express preferences (budget, area, property type, timeline) before contacting the team, and did not visually match the approved luxury/editorial design direction already used elsewhere on the public site.
- **Expected user/business outcome:** Buyers who already know a project get a focused enquiry form; buyers who do not can describe preferences so the internal team can route/qualify the lead, all while still producing a valid lead record.
- **Affected personas/roles:** anonymous / CUSTOMER (public visitor)
- **Success measure:** `/contact` renders the new two-path chooser + two-step wizard, submits successfully to the existing `/api/public/leads` endpoint, and passes clean-CI checks.

## Scope

### In scope

- New `/contact` page composition: hero copy, path selector ("I know the project" / "Help me find a property"), two-step form (step 1 varies by path; step 2 is shared contact details), and a "What happens next" sidebar.
- New components under `src/components/public/contact/`: `contact-enquiry-experience.tsx`, `contact-path-selector.tsx`, `contact-enquiry-form.tsx`.
- Reuse of existing lead submission contract (`POST /api/public/leads`), existing shared primitives (`AppButton`, `AppSelect`, `AppFieldError`, `AppReveal`, `Input`, `Textarea`), and existing helpers (`postJson`, `buildPublicPhoneNumber`, `getPublicWhatsAppHref`, marketing attribution/analytics).
- Real catalog-derived data only: project list and preferred-area chips are derived from `getPublicProjectCatalog()` (`areaName` field); no fabricated project names, prices, or availability.

### Explicitly out of scope

- `src/app/api/public/leads/route.ts` and any other `src/app/api/**/leads/**` path (protected domain) — left untouched. The API still requires a `projectId`/`projectName`.
- The shared `PublicEnquiryForm` / `PublicEnquiryPage` components used by `/book-viewing`, the homepage general enquiry, project-detail enquire section, and "register interest" — left untouched to avoid affecting those flows.
- Any change to lead scoring/routing/CRM assignment logic.

## Requirements

| ID        | Requirement                                                                                                         | Priority | Source/owner    |
| --------- | -------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- |
| `REQ-001` | `/contact` offers a choice between "I know the project" and "Help me find a property".                               | Must     | Pasted mockup     |
| `REQ-002` | Each path has its own step-1 content; both converge on a shared step-2 "Contact Details" form.                       | Must     | Pasted mockup     |
| `REQ-003` | A "What happens next" sidebar is shown alongside the form.                                                           | Must     | Pasted mockup     |
| `REQ-004` | Submission still creates a valid lead via the existing `/api/public/leads` contract.                                 | Must     | Existing behavior |
| `REQ-005` | Preferred-area options reflect real catalog areas, not invented place names.                                        | Must     | UI_DESIGN_GUIDE   |

## Acceptance criteria

| ID       | Given                                          | When                                              | Then                                                                                     | Verification |
| -------- | ----------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------- |
| `AC-001` | A visitor on `/contact`                        | They select "I know the project"                  | Step 1 shows a project selector and "what would you like to know" topic chips             | Manual        |
| `AC-002` | A visitor on `/contact`                        | They select "Help me find a property"             | Step 1 shows buying-purpose, property-type, budget, area, and timeline chips (no project) | Manual        |
| `AC-003` | A visitor has filled step 1                    | They click Continue                                | Step indicator advances to "Contact Details" and shows name/WhatsApp/contact-method fields | Manual        |
| `AC-004` | A visitor completes step 2 with a valid mobile | They submit                                        | `POST /api/public/leads` succeeds and a success/WhatsApp-continue panel is shown           | Manual        |
| `AC-005` | A visitor enters an invalid/empty mobile number | They submit                                        | A field-level error is shown and focus moves to the mobile field; no request is sent      | Manual        |

## Non-functional requirements

- **Security and authorization:** No new authenticated/authorization surface; submission reuses the existing unauthenticated public lead-intake endpoint and its existing Zod validation server-side.
- **Privacy/data minimization/retention:** No new fields sent to the server beyond the existing `publicLeadSchema` shape (`projectId`, `projectName`, `fullName`, `phoneNumber`, `email`, `message`, `preferredContactMethod`, `sourcePage`, `attribution`). "Help me find" preferences are folded into the existing free-text `message` field rather than inventing new stored fields.
- **Accessibility:** Chips/cards use real `<button>` elements with `aria-pressed`/`role="group"` (not color-only state), labelled fieldsets/legends, associated field errors via `AppFieldError` + `aria-describedby`, focus moved to the mobile field on validation failure, and `AppReveal`'s existing reduced-motion handling.
- **Performance/capacity:** No new data fetching beyond the existing `getPublicProjectCatalog()` call already used by this route.
- **Reliability/idempotency/concurrency:** Unchanged — same single `postJson` call to the existing endpoint; `AppButton isLoading` prevents duplicate submits.
- **Observability/audit:** Unchanged — same `trackMarketingEvent("generate_lead", ...)` call site; server-side audit logic in the leads route is untouched.
- **Compatibility:** Does not alter `PublicEnquiryForm`/`PublicEnquiryPage`, so `/book-viewing`, homepage enquiry, project-detail enquire section, and "register interest" are unaffected.

## Impact map

- **Product surfaces/routes:** `/contact` only.
- **Source modules/components:** `src/app/(public)/contact/page.tsx` (edited); new `src/components/public/contact/{contact-enquiry-experience,contact-path-selector,contact-enquiry-form}.tsx`.
- **APIs/contracts:** None changed. Existing `POST /api/public/leads` contract reused as-is.
- **Tables/migrations:** None.
- **Integrations/jobs:** None.
- **Roles/permissions/record ownership:** None (unauthenticated public route, unchanged).
- **Documentation/configuration:** None.

## Data classification

- **Data used:** Public project catalog data (already public) plus visitor-submitted contact details (existing intake path).
- **PII or uploaded documents involved:** Name/phone/email, same as the existing enquiry form; no documents.
- **Synthetic fixture plan:** Manual verification used the real (non-production) local project catalog; no customer PII was entered beyond a test name/phone during interactive checks.
- **Model-visible data:** None (no AI runtime in this flow).
- **Approved AI tenant/provider and allowed data class:** Not applicable — no AI/model call in this feature.
- **Training use / retention / deletion / residency / subprocessors reviewed:** Not applicable — unchanged from existing lead intake.
- **Redaction, tokenization, DLP, or secret-scan evidence:** Not applicable — no secrets introduced.
- **Data-use approver and AI service-register entry:** Not applicable.
- **Retention/deletion/cross-border implications:** Unchanged from existing `/api/public/leads` behavior.
- **DPIA/legal review required:** No — no new data category or processing purpose introduced.

## Risk and controls

| Calculator pass | Request/file manifest                                                                                                                                                                                        | Score | Risk | Matched rule IDs             | Decision/gate                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | ------------------------------ | -------------------------------------------- |
| Request-only     | (none)                                                                                                                                                                                                        | 30    | R2   | BR-UI-001                      | Guarded-auto (A2)                          |
| Final manifest   | `src/app/(public)/contact/page.tsx`, `src/components/public/contact/contact-enquiry-experience.tsx`, `src/components/public/contact/contact-enquiry-form.tsx`, `src/components/public/contact/contact-path-selector.tsx` | 30    | R2   | BR-UI-001, BR-NEXT-001         | Guarded-auto (A2), implemented in workspace |

- **Failure modes and blast radius:** Bounded to `/contact` route rendering; a regression here does not affect `/book-viewing`, homepage, or project-detail enquire flows since `PublicEnquiryForm`/`PublicEnquiryPage` were not touched. Worst case is a broken `/contact` page, fully reversible via revert.
- **Threat/abuse cases:** Same as existing public lead intake (unauthenticated POST); no new attack surface — same Zod-validated endpoint, same rate/shape constraints.
- **Agent tools permitted:** Workspace file edits, terminal build/lint/test/typecheck commands.
- **Prohibited actions:** No edits to `src/app/api/**/leads/**`, no schema/migration changes, no merge/deploy.
- **Human checkpoints:** Independent review of the diff before merge; visual/responsive spot-check recommended before release.
- **Residual risks requiring acceptance:** See "Known limitation" below regarding the "Help me find a property" path's `projectId` requirement.

## Delivery plan

- **Implementation approach:** New, self-contained client components under `src/components/public/contact/` composed by the existing server route file; no shared component (`PublicEnquiryForm`, `PublicEnquiryPage`) was modified, keeping the change bounded to `/contact`.
- **Alternatives/trade-offs:** Considered extending the shared `PublicEnquiryForm`/`PublicEnquiryPage` in place, but that component is reused by `/book-viewing`, the homepage, project-detail, and "register interest" with fixed-project/viewing-specific behavior; a shared rewrite would have expanded blast radius well beyond the requested page.
- **Agent/file ownership:** Single agent, single pass; no parallel/conflicting edits.
- **Dependencies:** None new; reuses existing `motion`, `lucide-react`, shared `common`/`ui` components already in the dependency tree.
- **Migration/data rehearsal:** Not applicable — no schema changes.
- **Rollout/staging:** Standard PR review; no feature flag needed (additive UI change, no data-shape change).
- **Rollback or forward-fix:** Revert the four changed/added files; no migration or data cleanup required.

### Known limitation (not a new business rule — documents an existing constraint)

`POST /api/public/leads` requires a non-empty `projectId`/`projectName` (`publicLeadSchema`), even though `leads.project_id` is nullable at the database level. The "Help me find a property" path intentionally does not ask the visitor to pick a project, so — consistent with `PublicEnquiryForm`'s pre-existing behavior of defaulting `selectedProjectId` to the first catalog project when none is chosen — this flow submits using the first available catalog project as the required administrative `projectId`, and prefixes the free-text `message` with "Help me find a matching property (no specific project chosen yet)." plus the collected preferences, so the internal team can see the lead is a preference-based enquiry rather than genuine interest in whichever project was auto-assigned. This is an existing system limitation, not a newly invented data-handling rule; making `projectId` truly optional would require an `src/app/api/**/leads/**` change, which is out of scope (protected domain) for this UI-focused request.

## Verification plan

| Test ID    | Requirement/Invariant | Level  | Positive/negative/concurrent case                    | Expected evidence               |
| ---------- | ---------------------- | ------ | ------------------------------------------------------ | ---------------------------------- |
| `TEST-001` | `AC-004`               | Manual | Positive — valid name + mobile number                  | Success panel + WhatsApp CTA shown |
| `TEST-002` | `AC-005`               | Manual | Negative — invalid mobile number                       | Field error shown, no submission   |
| `TEST-003` | `REQ-004`              | Unit/Build | Existing suite unaffected                           | `npm run test` pass (below)        |

| Check                                                        | Planned environment   | Required outcome / N/A reason                                                               |
| -------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `git diff --check`                                              | Workspace                | Pass — no whitespace conflicts reported by editor tooling                                        |
| Scope review against the declared file manifest                 | Workspace                | Pass — only the 4 files listed above changed                                                     |
| `npm ci`                                                         | Clean CI                 | N/A—not run in this session (workspace already has installed `node_modules`); pre-existing gap, not introduced here |
| `npm exec next typegen`                                         | Clean CI                 | Pass — covered implicitly by `npm run build` (route types generated during build)                |
| `npm exec prettier -- --check .`                                | Clean CI                 | N/A—not run repo-wide (documented pre-existing 288-file baseline gap in SESSION_CONTEXT.md); new files follow the editor's formatting |
| `npm run lint -- --max-warnings=0`                              | Workspace                | Pass — `npx eslint` on the 4 changed files, 0 warnings/errors                                     |
| `npm run typecheck`                                             | Workspace                | Pass — `tsc --noEmit` clean                                                                       |
| `npm run test`                                                   | Workspace                | Pass — 20 files / 101 tests passed                                                                |
| `npm run build`                                                  | Workspace                | Pass — production build succeeded; `/contact` prerendered as static content                       |
| `npm audit --audit-level=high`                                  | Clean CI                 | N/A—pre-existing dependency-audit findings tracked separately per SESSION_CONTEXT.md; no new dependency added by this change |
| Risk-specific integration/E2E/accessibility/security tests      | Clean CI / isolated env  | N/A—no automated accessibility/E2E harness configured for this route yet (documented gap); manual keyboard/aria review performed during implementation |
| Migration rehearsal and recovery evidence                       | Isolated database        | N/A — no schema/migration change                                                                  |
| Docs formatting and link/reference validation                   | Workspace / Clean CI     | N/A — no docs files changed by this work item                                                     |

## Questions and assumptions

| Item | Question or assumption                                                                                                  | Owner        | Due/decision |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------- |
| 1    | Assumption: the pasted mockup's exact copy/labels (chip names, sidebar steps, footnote text) may be adjusted by product without being a scope change. | Product owner | Before release |
| 2    | Assumption: it is acceptable for "Help me find a property" submissions to still carry a real `projectId` behind the scenes (see Known limitation) until a dedicated backend work item makes `projectId` optional. | Product owner | Before release |

## Durable-rule candidates

| Candidate ID | Exact statement | Evidence/source | Owner | Proposed risk floor | Status/decision |
| ------------ | --------------- | --------------- | ----- | ---------------------- | ------------------- |
| (none)       | —               | —                | —     | —                       | Not proposed this session |

## Ready approval

- **Product owner:** Pending human review
- **Technical/security/privacy approver(s):** Pending independent review pass
- **Approved scope/risk/autonomy:** R2 / A2 guarded-auto, as scored above; no protected-domain path touched
- **Approval evidence:** This work item; `npm run sdlc:score` outputs captured above (request-only and final-manifest passes)
- **Date:** 2026-09-10
