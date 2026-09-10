# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260910-124500-5C8E1D42
- **Title:** Remove redundant public Book Viewing entry point
- **Status:** VERIFIED
- **Human owner:** PropertyGoJB engineering owner
- **Requested by:** Repository user
- **Sanitized original request:** Remove the separate public Book Viewing page because Contact already handles enquiries.
- **Target date:** 2026-09-10
- **Risk class:** R3 after exact-file scoring
- **Autonomy ceiling:** A2
- **Required approvers:** Human owner for release/deployment

## Business outcome

- **Problem/opportunity:** Avoid presenting two competing public enquiry entry points for the same lead-capture workflow.
- **Expected user/business outcome:** Visitors use Contact for general enquiries and viewing requests; internal booking and account workflows remain available.
- **Affected personas/roles:** anonymous / CUSTOMER / AGENT / ADMIN / SUPER_ADMIN
- **Success measure:** `/book-viewing` is no longer a public indexable page, `/contact` remains available, and existing viewing-request handling remains in the Contact form.

## Scope

### In scope

- Remove the public Book Viewing page and public shell/footer links.
- Remove its sitemap entry and stale public revalidation path.
- Remove the unused public route constant.

### Explicitly out of scope

- Removing booking tables, APIs, account bookings, viewing records, appointment workflows, or internal booking permissions.
- Removing the Contact form's “Book a Viewing” enquiry type.
- Changing viewing validation, Malaysia-time handling, deduplication, or requested-versus-confirmed state semantics.

## Requirements

| ID | Requirement | Priority | Source/owner |
| --- | --- | --- | --- |
| `REQ-001` | Remove the separate public Book Viewing navigation/page entry point. | Must | User |
| `REQ-002` | Preserve Contact enquiry and viewing-request handling. | Must | User / engineering |
| `REQ-003` | Preserve internal booking and account workflows. | Must | Engineering |

## Acceptance criteria

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| `AC-001` | The public route is removed | A visitor requests `/book-viewing` | The response is HTTP 404 and the route is absent from the sitemap | Local smoke test and source review |
| `AC-002` | Contact remains the public enquiry surface | A visitor requests `/contact` | The response is HTTP 200 | Local smoke test |
| `AC-003` | Internal booking/account routes exist | The public page is removed | Booking domain files and account routes remain unchanged | Scope review |

## Non-functional requirements

- **Security and authorization:** No authorization logic is changed; shared route configuration retains only routes used by current public/auth code.
- **Privacy/data minimization/retention:** No data handling changes.
- **Accessibility:** Removing duplicate navigation reduces choices; Contact's existing accessible form remains unchanged.
- **Performance/capacity:** Removes one public page and one sitemap URL.
- **Reliability/idempotency/concurrency:** Viewing and booking domain logic is untouched.
- **Observability/audit:** No mutation or audit behavior changes.
- **Compatibility:** Existing Contact, project, account, and internal routes remain intact.

## Impact map

- **Product surfaces/routes:** `/book-viewing` removed; `/contact` retained.
- **Source modules/components:** Public shell, sitemap, public revalidation, route constants.
- **APIs/contracts:** None changed.
- **Tables/migrations:** None.
- **Integrations/jobs:** None.
- **Roles/permissions/record ownership:** No change.
- **Documentation/configuration:** This work item only.

## Data classification

- **Data used:** Public / Internal workflow references
- **PII or uploaded documents involved:** No
- **Synthetic fixture plan:** No new fixture data.
- **Model-visible data:** No customer data.
- **Approved AI tenant/provider and allowed data class:** Not applicable.
- **Training use / retention / deletion / residency / subprocessors reviewed:** Not applicable.
- **Redaction, tokenization, DLP, or secret-scan evidence:** Not applicable.
- **Data-use approver and AI service-register entry:** Not applicable.
- **Retention/deletion/cross-border implications:** None.
- **DPIA/legal review required:** No — public navigation change only.

## Risk and controls

| Calculator pass | Request/file manifest | Score | Risk | Matched rule IDs | Decision/gate |
| --- | --- | --- | --- | --- | --- |
| Request-only | No files | 45 | R2 | `BR-VIEW-001` | Guarded-auto with viewing controls |
| Final manifest | Public page, shell, sitemap, revalidation, routes config | 50 | R3 | `BR-AUTH-003`, `BR-PROJECT-002`, `BR-PROJECT-003`, `BR-VIEW-001`, `BR-CONFIG-001`, `BR-SEO-001`, `BR-UI-001`, `BR-NEXT-001` | User-approved scope; no authentication behavior changed; release remains human-controlled |

- **Failure modes and blast radius:** A stale link may reach a 404; public Contact remains the replacement. Internal booking workflows are outside the changed files.
- **Threat/abuse cases:** No new mutation, redirect, or privilege boundary.
- **Agent tools permitted:** Workspace editing and local validation only.
- **Prohibited actions:** No deployment, merge, production change, or database mutation.
- **Human checkpoints:** Human review before release.
- **Residual risks requiring acceptance:** Existing external links to `/book-viewing` will no longer open the old form; a redirect could be added later if preserving legacy links is required.

## Delivery plan

- **Implementation approach:** Delete the public page, remove public navigation/sitemap/revalidation references, and remove the unused route constant.
- **Alternatives/trade-offs:** A redirect to `/contact` could preserve old links, but the requested outcome was to remove the duplicate entry point; current behavior is a clean 404.
- **Agent/file ownership:** Coding agent owns the scoped public files; human owns release.
- **Dependencies:** Existing Contact enquiry experience and form.
- **Migration/data rehearsal:** Not applicable.
- **Rollout/staging:** Normal application rollout; additive removal is reversible from version control.
- **Rollback or forward-fix:** Restore the page and links, or add a deliberate redirect to `/contact` if legacy-link analytics warrant it.

## Verification plan

| Test ID | Requirement/Invariant | Level | Positive/negative/concurrent case | Expected evidence |
| --- | --- | --- | --- | --- |
| `TEST-001` | `REQ-001` | Integration smoke | Negative: `/book-viewing` | HTTP 404 |
| `TEST-002` | `REQ-002` | Integration smoke | Positive: `/contact` | HTTP 200 |
| `TEST-003` | `REQ-003` | Scope review | Booking/account files untouched | Diff contains no booking-domain edits |
| `TEST-004` | Route validity | Typecheck/lint | Positive | Typecheck and focused ESLint pass |

| Check | Planned environment | Required outcome / N/A reason |
| --- | --- | --- |
| `git diff --check` | Workspace | Pass |
| Scope review against the declared file manifest | Workspace | Pass |
| `npm ci` | Clean CI | Not run; existing dirty worktree preserved |
| `npm exec next typegen` | Clean CI | Not run; no route addition; typecheck passed |
| `npm exec prettier -- --check .` | Clean CI | Focused changed-file check passed; repository-wide baseline not run |
| `npm run lint -- --max-warnings=0` | Clean CI | Focused changed-file ESLint passed; full command not run |
| `npm run typecheck` | Workspace | Pass |
| `npm run test` and applicable coverage | Clean CI | Not run; no test harness for navigation removal |
| `npm run build` | Clean CI | Not run; local route smoke completed |
| `npm audit --audit-level=high` | Clean CI | Not run; dependency audit outside scope |
| Risk-specific integration/E2E/accessibility/security tests | Local server | HTTP smoke pass; no browser suite configured |
| Migration rehearsal and recovery evidence | Isolated database | N/A — no migration |
| Docs formatting and link/reference validation | Workspace | Work item recorded; no application docs changed |

## Questions and assumptions

| Item | Question or assumption | Owner | Due/decision |
| --- | --- | --- | --- |
| 1 | Existing external `/book-viewing` links are allowed to return 404; preserving them would require a separate redirect decision. | Product owner | Before release |

## Durable-rule candidates

| Candidate ID | Exact statement | Evidence/source | Owner | Proposed risk floor | Status/decision |
| --- | --- | --- | --- | --- | --- |
| None | No new durable business rule inferred. | This routing change | Product owner | Not applicable | Not proposed |

## Ready approval

- **Product owner:** User explicitly requested removal in chat
- **Technical/security/privacy approver(s):** Pending human review
- **Approved scope/risk/autonomy:** Public entry-point removal only; internal booking/viewing controls preserved
- **Approval evidence:** User request: “I think dont need Booking viewing. as already have contact”
- **Date:** 2026-09-10