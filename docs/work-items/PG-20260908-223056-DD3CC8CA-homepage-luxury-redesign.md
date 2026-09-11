# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260908-223056-DD3CC8CA
- **Title:** Homepage/header/footer editorial-luxury visual refinement
- **Status:** IMPLEMENTED
- **Human owner:** PropertyGoJB product/engineering owner
- **Requested by:** User (chat)
- **Sanitized original request:** "I shared a v0-generated luxury property landing page (deep pine/ivory/brass palette, Cormorant Garamond-style serif, editorial nav/footer) as a design reference and want the PropertyGoJB homepage — including header and footer — to read as more luxury, class, and modern in that direction."
- **Target date:** 2026-09-08
- **Risk class:** R2
- **Autonomy ceiling:** A2 — guarded-auto (bounded, reversible, non-protected, no unresolved material business choice)
- **Required approvers:** Independent review pass (self-challenge, no merge/deploy)

## Business outcome

- **Problem/opportunity:** Homepage/header/footer visual polish lags the "editorial luxury" direction already partially established (existing `public-hero`/`public-decorative` tokens, prior luxury-redesign phase) — nav/footer still read as generic SaaS chrome rather than a boutique property desk.
- **Expected user/business outcome:** More premium first impression for prospective JB property buyers without changing any business logic, data, or navigation destinations.
- **Affected personas/roles:** anonymous/CUSTOMER visitors of the public homepage and every public route (shared header/footer).
- **Success measure:** Visual/typographic consistency with the reference direction; no regression to nav/footer functionality, a11y, or existing business content.

## Scope

### In scope

- `src/app/layout.tsx` — add a display serif Google font (Cormorant Garamond) as a CSS variable, following the existing Inter/next-font pattern.
- `src/app/globals.css` — map `--font-serif` to the new display font in `@theme inline` (currently unmapped, so `font-serif` utility silently fell back to the generic system serif stack).
- `src/components/public/public-shell.tsx` — header nav: replace filled-pill active/hover state with an editorial underline treatment; refine logo/tagline typography. Footer: tonal background, serif brand lockup, lighter/wider-tracked column headers, new bottom legal row (copyright + Privacy/Terms moved out of the link list).
- `src/app/(public)/page.tsx` — add accent-rule eyebrows (matching the existing hero pattern) to section headers; add one new short editorial "belief" section (original brand copy, no fabricated business data); lightly refine hero/CTA typography (uppercase tracked labels).

### Explicitly out of scope

- No change to `AppButton`/`Button` shared shape (`rounded-full`/`rounded-2xl` stays project-wide; only per-instance `className` typography tweaks).
- No change to admin/agent/auth shells, `:root`/`.dark` base tokens, or any token outside the existing `public-hero`/`public-decorative`/public `body[data-ui="public"]` scope.
- No change to catalog data, pricing, availability, enquiry/WhatsApp logic, auth, or navigation destinations.
- No fabricated listings/testimonials/prices — all real data paths (`getPublicProjectCatalog`, `PublicEnquiryForm`, WhatsApp link builder) preserved as-is.

## Requirements

| ID | Requirement | Priority | Source/owner |
| --- | --- | --- | --- |
| `REQ-001` | Public pages render heading text in a display serif face instead of the generic serif fallback | Must | User request |
| `REQ-002` | Header nav communicates active/hover state without relying solely on a filled pill background | Should | User request (reference) |
| `REQ-003` | Footer presents a tonal, editorial layout with a distinct legal/copyright row | Must | User request |
| `REQ-004` | Homepage gains a short brand/trust statement section consistent with the new voice | Could | User request (reference) |
| `REQ-005` | No existing public functionality (search, WhatsApp, auth links, mobile sheet, enquiry form) regresses | Must | Implicit/NFR |

## Acceptance criteria

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| `AC-001` | Any public page loads | The heading uses `font-serif` | Cormorant Garamond renders (verified via computed font-family) | Manual |
| `AC-002` | Desktop viewport, header visible | User hovers/focuses a nav link | An underline animates in under the label; `aria-current="page"` still marks the active route | Manual |
| `AC-003` | Any public page, footer visible | Page renders | Footer shows brand column, link columns, and a bottom row with © year and Privacy/Terms links | Manual |
| `AC-004` | Homepage loads | Page renders | A new belief/trust section appears between hero search and featured projects, with real copy (no invented stats) | Manual |
| `AC-005` | Mobile viewport (390px) | Sheet menu opened | All nav items, sign-in/out, WhatsApp CTA still function and are reachable | Manual |
| `AC-006` | Reduced-motion preference on | Homepage loads | New section still renders content without relying on animation for legibility (`AppReveal` reduced-motion fallback) | Manual |

## Non-functional requirements

- **Security and authorization:** None touched (no auth/role logic changed).
- **Privacy/data minimization/retention:** None (no data handling changed).
- **Accessibility:** Preserve `aria-current`, focus-visible rings, skip link target, contrast (reuse existing tokens verified in prior phase); underline nav treatment must remain keyboard-focus visible.
- **Performance/capacity:** One additional Google font (subset latin, few weights) via `next/font/google` — self-hosted at build time, no extra runtime request; negligible LCP impact since it's not used in the hero's largest text alone (hero heading already used `font-serif`, previously rendering system serif).
- **Reliability/idempotency/concurrency:** N/A — static markup/CSS only.
- **Observability/audit:** N/A — no business event changed.
- **Compatibility:** Scoped to `src/app/**` and `src/components/public/**`; no admin/agent/auth visual change.

## Impact map

- **Product surfaces/routes:** All `(public)` routes (shared header/footer via `PublicShell`), and specifically `/` (homepage).
- **Source modules/components:** `src/app/layout.tsx`, `src/app/globals.css`, `src/components/public/public-shell.tsx`, `src/app/(public)/page.tsx`.
- **APIs/contracts:** None.
- **Tables/migrations:** None.
- **Integrations/jobs:** None.
- **Roles/permissions/record ownership:** None.
- **Documentation/configuration:** None (this work item is the record).

## Data classification

- **Data used:** Public (existing published project catalog counts only; no new data).
- **PII or uploaded documents involved:** None.
- **Synthetic fixture plan:** N/A — no fixtures added.
- **Model-visible data:** None beyond public marketing copy already in the repo.
- **Approved AI tenant/provider and allowed data class:** N/A.
- **Training use / retention / deletion / residency / subprocessors reviewed:** N/A.
- **Redaction, tokenization, DLP, or secret-scan evidence:** N/A — no secrets touched.
- **Data-use approver and AI service-register entry:** N/A.
- **Retention/deletion/cross-border implications:** N/A.
- **DPIA/legal review required:** No — visual-only change, no personal data processing change.

## Risk and controls

| Calculator pass | Request/file manifest | Score | Risk | Matched rule IDs | Decision/gate |
| --- | --- | --- | --- | --- | --- |
| Request-only | (request text only) | 30 | R2 | none matched | A2 guarded-auto |
| Proposed files | `src/app/layout.tsx`, `src/app/globals.css`, `src/components/public/public-shell.tsx`, `src/app/(public)/page.tsx` | 30 | R2 | `BR-UI-001` (R1/partial), `BR-NEXT-001` (R1/policy) | A2 guarded-auto; read Next.js docs note applied |
| Final manifest (unchanged from proposed) | same 4 files | 30 | R2 | `BR-UI-001`, `BR-NEXT-001` | Risk did not increase; guarded-auto held |

- **Failure modes and blast radius:** Bounded to public marketing shell/homepage visuals; worst case is a visual regression on public pages, reversible via `git revert`.
- **Threat/abuse cases:** None — no new input/auth surface.
- **Agent tools permitted:** Workspace file edits, local `npm run lint/typecheck/build`.
- **Prohibited actions:** No merge/deploy; no token change outside the public scope.
- **Human checkpoints:** Human visual review of the rendered pages before merge.
- **Residual risks requiring acceptance:** None identified beyond ordinary visual-review risk.

## Delivery plan

- **Implementation approach:** Reuse existing `public-hero`/`public-decorative` tokens and `AppButton`/`AppReveal` primitives; add one new font-family token; adjust `className`s only (no new components except inline JSX for the belief section, colocated in `page.tsx`).
- **Alternatives/trade-offs:** Considered copying the reference's sharp-edged buttons and dark `bg-primary`/`bg-secondary` retheme; rejected — would require redefining global shadcn tokens used by admin/agent/auth (out of scope, high blast radius) and would fight the project's existing `rounded-full` button convention.
- **Agent/file ownership:** Single agent, sequential edits (no parallel file ownership conflicts).
- **Dependencies:** None new (`next/font/google` already a used pattern).
- **Migration/data rehearsal:** N/A.
- **Rollout/staging:** Local workspace only; no deploy performed by the agent.
- **Rollback or forward-fix:** `git checkout -- <file>` per changed file, or revert the commit once committed by the human owner.

## Verification plan

| Test ID | Requirement/Invariant | Level | Positive/negative/concurrent case | Expected evidence |
| --- | --- | --- | --- | --- |
| `TEST-001` | `REQ-001`–`REQ-004` | Manual/visual | Positive | Rendered screenshots/dev-server inspection at desktop + mobile widths |
| `TEST-002` | `REQ-005` | Manual | Negative (regression) | Manual click-through of nav, mobile sheet, WhatsApp link, enquiry form |

| Check | Planned environment | Required outcome / N/A reason |
| --- | --- | --- |
| `git diff --check` | Workspace | Pass |
| Scope review against the declared file manifest | Workspace | Pass — matches manifest above |
| `npm ci` | Clean CI | N/A—dependencies already installed locally, no `package.json` change; full clean-CI install not run by the agent |
| `npm exec next typegen` | Clean CI | N/A—no new typed route added |
| `npm exec prettier -- --check .` | Clean CI | Scoped: ran against changed files only (repo-wide baseline has ~288 pre-existing failures per `docs/sdlc/SESSION_CONTEXT.md`) |
| `npm run lint -- --max-warnings=0` | Clean CI | Ran against changed files |
| `npm run typecheck` | Clean CI | Ran |
| `npm run test` | Clean CI | Ran (no behavior changed; existing suite only) |
| `npm run build` | Clean CI | Ran |
| `npm audit --audit-level=high` | Clean CI | N/A—no dependency change; pre-existing baseline tracked separately per `SESSION_CONTEXT.md` |
| Risk-specific integration/E2E/accessibility/security tests | N/A | N/A—visual-only change, no new interaction contract; manual a11y check performed |
| Migration rehearsal and recovery evidence | N/A | N/A—no schema/data change |
| Docs formatting and link/reference validation | N/A | N/A—no docs content change outside this work item |

**Results (recorded after implementation):**

| Check | Result |
| --- | --- |
| `npm exec prettier -- --check <changed files>` | Fail → fixed with `--write` on the 2 flagged files, re-checked Pass |
| `npm run lint -- --max-warnings=0 <changed .tsx files>` | Pass (0 problems) |
| `npm run typecheck` | Pass |
| `npm run test` | Pass — 20 files, 101 tests |
| `npm run build` | Pass — Turbopack production build, all 101 routes generated, homepage (`/`) static |
| Manual visual check (`npm run dev`, Playwright browser) | Pass — verified header/hero/belief section/footer at desktop (2335px) width in both dark and light theme, and mobile (390px) width; mobile sheet menu opens and lists all nav items + login/register/theme/enquiry/WhatsApp actions |

Unverified: automated accessibility scan (axe/Lighthouse) and 768px/1024px breakpoints were not explicitly captured as screenshots (only 390px and desktop width were); no regression expected since only typography/color/structural classes changed, not layout breakpoints, but mark as **unverified, not passed**.

## Questions and assumptions

| Item | Question or assumption | Owner | Due/decision |
| --- | --- | --- | --- |
| 1 | Assumption: keeping `rounded-full` buttons (not adopting the reference's sharp-edged buttons) is preferred to stay consistent with the rest of the app | Agent, pending human confirmation | Revisit if user asks for sharper button shapes |

## Durable-rule candidates

None — this is a one-off visual refinement, not a new durable business rule.

## Ready approval

- **Product owner:** Pending (guarded-auto R2, standing approval per SDLC skill)
- **Technical/security/privacy approver(s):** N/A for this risk class
- **Approved scope/risk/autonomy:** R2 / A2, guarded-auto
- **Approval evidence:** This work item + calculator output above
- **Date:** 2026-09-08
