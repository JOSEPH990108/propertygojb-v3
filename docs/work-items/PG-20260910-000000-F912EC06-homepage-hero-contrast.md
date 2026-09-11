# Homepage hero contrast regression

## Identity and ownership

- **Work item ID:** PG-20260910-000000-F912EC06
- **Title:** Restore homepage hero contrast after Phase 2B promotion
- **Status:** VERIFIED
- **Human owner:** Joseph Chong
- **Requested by:** Joseph Chong
- **Sanitized original request:** Fix the homepage design regression shown in the staging screenshot; restore the intended homepage appearance without changing unrelated behavior.
- **Target date:** 2026-09-10
- **Risk class:** R2
- **Autonomy ceiling:** A2
- **Required approvers:** Human reviewer before merge/deployment

## Business outcome

- **Problem/opportunity:** The promoted staging homepage hero is overly dark because multiple black scrims compound across the image and floating header.
- **Expected user/business outcome:** Public visitors can read the hero navigation and copy while seeing the lifestyle image clearly.
- **Affected personas/roles:** anonymous, CUSTOMER
- **Success measure:** Hero image and header remain legible at the top of the homepage without changing content or navigation behavior.

## Scope

### In scope

- Reduce the homepage hero image scrim opacity.
- Reduce the floating public-header scrim opacity.

### Explicitly out of scope

- Authentication, lead capture, project data, navigation structure, deployment configuration, and unrelated routes.
- Merging or pushing branches.

## Requirements

| ID | Requirement | Priority | Source/owner |
| --- | --- | --- | --- |
| `REQ-001` | Restore readable homepage hero/header contrast while preserving the existing layout and content. | Must | User |

## Acceptance criteria

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| `AC-001` | A visitor opens the public homepage at the top of the page. | The hero renders behind the floating header. | The image is not excessively darkened and hero/header copy remains readable. | Manual preview pending; build/typecheck passed |
| `AC-002` | The public homepage is built for production. | Next.js compiles the changed route. | The production build completes successfully. | Automated: Pass |

## Non-functional requirements

- **Security and authorization:** No authorization or server behavior changed.
- **Privacy/data minimization/retention:** No data handling changed.
- **Accessibility:** Preserve semantic content and improve visual contrast; keyboard behavior unchanged.
- **Performance/capacity:** No new assets, dependencies, or client work added.
- **Reliability/idempotency/concurrency:** Not applicable; visual-only CSS class changes.
- **Observability/audit:** No runtime event changes.
- **Compatibility:** Preserve responsive Tailwind classes and reduced-motion behavior.

## Impact map

- **Product surfaces/routes:** Public homepage `/` and shared public header.
- **Source modules/components:** `src/app/(public)/page.tsx`, `src/components/public/public-shell.tsx`.
- **APIs/contracts:** None.
- **Tables/migrations:** None.
- **Integrations/jobs:** None.
- **Roles/permissions/record ownership:** None.
- **Documentation/configuration:** This work item only.

## Data classification

- **Data used:** Public
- **PII or uploaded documents involved:** None
- **Synthetic fixture plan:** Not applicable.
- **Model-visible data:** Public source code and synthetic screenshot context only.
- **Approved AI tenant/provider and allowed data class:** Not applicable.
- **Training use / retention / deletion / residency / subprocessors reviewed:** Not applicable.
- **Redaction, tokenization, DLP, or secret-scan evidence:** No secrets or customer data used.
- **Data-use approver and AI service-register entry:** Not applicable.
- **Retention/deletion/cross-border implications:** None.
- **DPIA/legal review required:** No — visual-only change.

## Risk and controls

| Calculator pass | Request/file manifest | Score | Risk | Matched rule IDs | Decision/gate |
| --- | --- | --- | --- | --- | --- |
| Request-only | No files | 30 | R2 | None | Guarded-auto plan, clean CI, independent review, preview smoke |
| Proposed files | `src/app/(public)/page.tsx`, `src/components/public/public-shell.tsx` | 30 | R2 | BR-UI-001, BR-NEXT-001 | Guarded-auto within bounded UI scope |
| Final manifest | Same two source files plus this work item | 30 | R2 | BR-UI-001, BR-NEXT-001 | Human review required before merge/deployment |

- **Failure modes and blast radius:** Hero remains too dark or becomes too light; impact is limited to public homepage presentation.
- **Threat/abuse cases:** None introduced.
- **Agent tools permitted:** Read-only inspection, scoped source edit, local validation.
- **Prohibited actions:** Push, merge, deploy, alter credentials, or change protected domains.
- **Human checkpoints:** Review the visual preview, merge into `staging1`, and promote deployment.
- **Residual risks requiring acceptance:** Browser/deployment visual preview is unverified because no browser page was shared.

## Delivery plan

- **Implementation approach:** Reduce the three homepage image scrims from 80/45/10, 40/0/10, and 70% top opacity to 55/25/5, 25/0/0, and 40% top opacity; reduce the shared header scrim from 55/25 to 35/10.
- **Alternatives/trade-offs:** Removing overlays entirely would expose unreadable text over bright architecture; lighter overlays preserve the existing editorial composition.
- **Agent/file ownership:** Copilot: two source files; human: review and release.
- **Dependencies:** Existing public hero image and semantic theme tokens.
- **Migration/data rehearsal:** Not applicable.
- **Rollout/staging:** Merge the reviewed change into `staging1`, then redeploy the staging domain.
- **Rollback or forward-fix:** Revert the two source-file changes if the staging preview shows insufficient contrast.

## Verification plan

| Test ID | Requirement/Invariant | Level | Positive/negative/concurrent case | Expected evidence |
| --- | --- | --- | --- | --- |
| `TEST-001` | `REQ-001` | Static | Changed classes compile and contain no whitespace errors. | Pass: typecheck and `git diff --check` |
| `TEST-002` | `AC-002` | Build | Production build of the public route. | Pass: `npm run build` |
| `TEST-003` | `AC-001` | Manual visual | Desktop/mobile homepage at top of page and after scroll. | Unverified: browser page not shared |

| Check | Planned environment | Required outcome / N/A reason |
| --- | --- | --- |
| `git diff --check` | Workspace / Clean CI | Pass |
| Scope review against the declared file manifest | Workspace / Clean CI | Pass; two source files changed |
| `npm ci` | Clean CI | Not run; no dependency change |
| `npm exec next typegen` | Clean CI | Not run; no route/type contract change |
| `npm exec prettier -- --check .` | Clean CI | Not run; inherited repository baseline is known to report unrelated files |
| `npm run lint -- --max-warnings=0` | Clean CI | Not run; focused typecheck/build passed |
| `npm run typecheck` | Workspace | Pass |
| `npm run test` and applicable coverage | Clean CI | Not run; no behavior/test contract changed |
| `npm run build` | Workspace | Pass |
| `npm audit --audit-level=high` | Clean CI | Not run; no dependency change |
| Risk-specific integration/E2E/accessibility/security tests | Preview | Unverified; browser page not shared |
| Migration rehearsal and recovery evidence | Isolated database | N/A — no migration |
| Docs formatting and link/reference validation | Workspace / Clean CI | N/A — work item only added |

## Questions and assumptions

| Item | Question or assumption | Owner | Due/decision |
| --- | --- | --- | --- |
| 1 | Assume the intended design is the existing Phase 2B luxury homepage with a visible lifestyle photo and readable ivory hero copy. | Human owner | Confirm during staging preview |

## Durable-rule candidates

| Candidate ID | Exact statement | Evidence/source | Owner | Proposed risk floor | Status/decision |
| --- | --- | --- | --- | --- | --- |
| None | No durable business rule proposed. | Visual-only fix | Human owner | N/A | N/A |

## Ready approval

- **Product owner:** Pending human review
- **Technical/security/privacy approver(s):** Pending human review
- **Approved scope/risk/autonomy:** R2 / A2 guarded-auto, bounded to two UI files
- **Approval evidence:** Request-only and exact-file SDLC scores recorded above
- **Date:** 2026-09-10
