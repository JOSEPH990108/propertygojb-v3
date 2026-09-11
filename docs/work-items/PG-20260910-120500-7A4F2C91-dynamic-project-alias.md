# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260910-120500-7A4F2C91
- **Title:** Add dynamic short project URL aliases
- **Status:** VERIFIED
- **Human owner:** PropertyGoJB engineering owner
- **Requested by:** Repository user
- **Sanitized original request:** Make short public project URLs dynamic so a published project at `/<slug>` permanently redirects to `/projects/<slug>`.
- **Target date:** 2026-09-10
- **Risk class:** R2
- **Autonomy ceiling:** A2
- **Required approvers:** Human owner for release/deployment

## Business outcome

- **Problem/opportunity:** Provide short campaign-friendly project URLs without creating duplicate indexable pages.
- **Expected user/business outcome:** Future published projects can use a short URL while retaining one canonical project page.
- **Affected personas/roles:** anonymous / CUSTOMER
- **Success measure:** A known published project short URL responds with HTTP 308 and points to its `/projects/<slug>` URL.

## Scope

### In scope

- Add one dynamic public `[slug]` route.
- Redirect only published, scheduled, non-deleted projects.
- Return 404 for unknown or unavailable top-level slugs.

### Explicitly out of scope

- Database schema changes or slug renaming.
- Automatic hyphen removal or alias-to-different-slug inference.
- Sitemap, canonical metadata, or project page changes.
- Deployment, merge, or production configuration changes.

## Requirements

| ID | Requirement | Priority | Source/owner |
| --- | --- | --- | --- |
| `REQ-001` | Redirect any published project slug from `/<slug>` to `/projects/<slug>` with a permanent redirect. | Must | User |
| `REQ-002` | Preserve existing static public routes and return 404 for unknown slugs. | Must | Engineering |

## Acceptance criteria

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| `AC-001` | A published project exists with slug `vistara-hills` | A visitor requests `/vistara-hills` | The response is HTTP 308 with `Location: /projects/vistara-hills` | Automated smoke test |
| `AC-002` | A static route exists at `/about` | A visitor requests `/about` | The static route remains available | Automated smoke test |
| `AC-003` | No published project exists for a slug | A visitor requests that slug | The response is HTTP 404 | Automated smoke test |

## Non-functional requirements

- **Security and authorization:** Reuse the public project query; no protected data or mutation is introduced.
- **Privacy/data minimization/retention:** Public project availability metadata only.
- **Accessibility:** Redirect has no rendered UI.
- **Performance/capacity:** One cached project lookup before redirect.
- **Reliability/idempotency/concurrency:** Redirect is deterministic and read-only.
- **Observability/audit:** No business mutation or audit event required.
- **Compatibility:** Next.js App Router dynamic segment; existing static routes retain precedence.

## Impact map

- **Product surfaces/routes:** `/<slug>` public short project aliases.
- **Source modules/components:** `src/app/(public)/[slug]/page.tsx`.
- **APIs/contracts:** None.
- **Tables/migrations:** None; reads the existing projects query.
- **Integrations/jobs:** None.
- **Roles/permissions/record ownership:** Anonymous public access only.
- **Documentation/configuration:** This work item only.

## Data classification

- **Data used:** Public
- **PII or uploaded documents involved:** No
- **Synthetic fixture plan:** Existing local public project data; no new fixture data.
- **Model-visible data:** No customer data; route and public project metadata only.
- **Approved AI tenant/provider and allowed data class:** Not applicable.
- **Training use / retention / deletion / residency / subprocessors reviewed:** Not applicable.
- **Redaction, tokenization, DLP, or secret-scan evidence:** Not applicable.
- **Data-use approver and AI service-register entry:** Not applicable.
- **Retention/deletion/cross-border implications:** None.
- **DPIA/legal review required:** No — public read-only routing.

## Risk and controls

| Calculator pass | Request/file manifest | Score | Risk | Matched rule IDs | Decision/gate |
| --- | --- | --- | --- | --- | --- |
| Request-only | No files | 30 | R2 | None | Guarded-auto; clean CI, independent review, preview smoke |
| Proposed files | `src/app/(public)/[slug]/page.tsx` | 30 | R2 | `BR-NEXT-001` | Guarded-auto; Next guide check required |
| Final manifest | `src/app/(public)/[slug]/page.tsx` | 30 | R2 | `BR-NEXT-001` | Implemented and locally verified; release remains human-controlled |

- **Failure modes and blast radius:** An incorrect dynamic route could affect unknown top-level paths; unknown paths explicitly return 404 and static routes are resolved first.
- **Threat/abuse cases:** No mutation or privilege boundary; unpublished projects are not redirected because the shared query filters them.
- **Agent tools permitted:** Workspace editing and local validation only.
- **Prohibited actions:** No deployment, merge, production changes, or database mutation.
- **Human checkpoints:** Human review before release.
- **Residual risks requiring acceptance:** A short alias with a different canonical slug requires a future explicit alias/SEO-slug field or mapping.

## Delivery plan

- **Implementation approach:** Add an App Router `[slug]` page using `getPublicProjectBySlug`, `notFound`, and `permanentRedirect`.
- **Alternatives/trade-offs:** A static Vistara-only alias was initially added and removed in favor of one dynamic route.
- **Agent/file ownership:** Coding agent owns the single source route; human owns release.
- **Dependencies:** Existing published project query and Next.js App Router.
- **Migration/data rehearsal:** Not applicable.
- **Rollout/staging:** Deploy with normal application rollout; route is additive and reversible.
- **Rollback or forward-fix:** Delete the dynamic route to remove short aliases.

## Verification plan

| Test ID | Requirement/Invariant | Level | Positive/negative/concurrent case | Expected evidence |
| --- | --- | --- | --- | --- |
| `TEST-001` | `REQ-001` | Manual integration | Positive: `/vistara-hills` | HTTP 308 and `Location: /projects/vistara-hills` |
| `TEST-002` | `REQ-002` | Manual integration | Negative: unknown slug; static: `/about` | HTTP 404 for unknown; HTTP 200 for `/about` |
| `TEST-003` | Route validity | Typecheck | Positive | `npm run typecheck` passes |

| Check | Planned environment | Required outcome / N/A reason |
| --- | --- | --- |
| `git diff --check` | Workspace | Pass |
| Scope review against the declared file manifest | Workspace | Pass; one source route plus this work item |
| `npm ci` | Clean CI | Not run; existing dependencies and dirty worktree preserved |
| `npm exec next typegen` | Workspace | Pass |
| `npm exec prettier -- --check .` | Clean CI | Not run repository-wide; focused route check passed |
| `npm run lint -- --max-warnings=0` | Clean CI | Focused ESLint check passed; full command not run |
| `npm run typecheck` | Workspace | Pass |
| `npm run test` and applicable coverage | Clean CI | Not run; no route test harness exists |
| `npm run build` | Clean CI | Not run; local preview smoke covered route behavior |
| `npm audit --audit-level=high` | Clean CI | Not run; dependency audit is outside this routing change |
| Risk-specific integration/E2E/accessibility/security tests | Local server | Pass for HTTP smoke cases; no browser suite configured |
| Migration rehearsal and recovery evidence | Isolated database | N/A — no migration |
| Docs formatting and link/reference validation | Workspace | Pass for work-item structure; version-matched Next guide was unavailable in installed docs path |

## Questions and assumptions

| Item | Question or assumption | Owner | Due/decision |
| --- | --- | --- | --- |
| 1 | Short aliases use the same database slug as the canonical project URL. Different aliases require explicit mapping. | Product/engineering | Before any alternate-slug requirement |

## Durable-rule candidates

| Candidate ID | Exact statement | Evidence/source | Owner | Proposed risk floor | Status/decision |
| --- | --- | --- | --- | --- | --- |
| None | No new durable business rule inferred. | This routing change | Product owner | Not applicable | Not proposed |

## Ready approval

- **Product owner:** Pending human review
- **Technical/security/privacy approver(s):** Pending human review
- **Approved scope/risk/autonomy:** Guarded-auto R2 implementation recorded; release not approved by agent
- **Approval evidence:** User requested implementation in chat
- **Date:** 2026-09-10