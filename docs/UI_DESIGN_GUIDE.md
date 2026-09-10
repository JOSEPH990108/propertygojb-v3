# PropertyGoJB UI generation guide

- **Status:** Active guide for Codex and Copilot UI work.
- **Source:** Published from [docs/work-items/PG-20260905-114744-4A3610E7-ui-design-guide.md](work-items/PG-20260905-114744-4A3610E7-ui-design-guide.md), which remains the audit/decision history and the record of what Phases 1–6 already implemented. This file is the living reference; update it only when an approved design decision changes it.
- **Owner:** PropertyGoJB product/engineering owner.

## 1. Authority and working method

Follow applicable repository instructions, the SDLC skill, active business rules, and the approved work-item scope. Read version-matched local Next.js guides before framework changes. This guide defines visual and interaction conventions; it does not authorize changes to permissions, publication, booking, payment, document decisions, or consent.

For every UI task:

1. Identify the persona, route, primary user task, data source, and closest existing screen. Inspect its shell and imported components.
2. Inspect `src/app/globals.css`, `components.json`, and relevant `src/components/ui`, `common`, and domain components. Read actual prop types before using them.
3. State a short implementation contract: files, reused components, layout, data/interaction states, responsive behavior, and acceptance checks. Infer routine choices.
4. Run request-only and exact-file SDLC scoring before mutation. Read matched rules and observe their gates.
5. Implement the smallest scoped change. Record deficiencies in existing shared components instead of silently copying them or refactoring unrelated screens.
6. Verify behavior and visual states; record actual results and unverified cases. Update the guide only when an approved design decision changes it.

## 2. Product identity and surface recipes

Use the current blue/slate palette, Inter typography, Lucide icons, rounded panels, restrained shadows, and real project media. Keep decorative gradients primarily in brand/hero areas. One dominant action per task region is the default; avoid competing filled buttons.

| Surface          | Composition                                                                                                 | Reference                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Public landing   | Shared shell; dark hero with clear value proposition and search; project discovery; enquiry support         | `src/app/(public)/page.tsx`, `src/components/public/public-shell.tsx`                          |
| Public listing   | Heading, URL-aware filters where established, results/count, cards and map alternative, no-results recovery | `src/app/(public)/projects/page.tsx`, `public-projects-filters.tsx`, `public-project-card.tsx` |
| Project detail   | Title/location, media, truthful price and availability, layouts/details, enquiry or viewing action          | `src/app/(public)/projects/[slug]/page.tsx`                                                    |
| Customer account | Account shell, journey/status summary, scoped records and clear next action                                 | `src/app/(public)/account/layout.tsx`                                                          |
| Authentication   | Existing AuthPageShell/AuthCard; focused form; optional large-screen brand panel                            | `src/components/auth/auth-page-shell.tsx`, `auth-card.tsx`                                     |
| Internal list    | Existing role shell; compact heading/actions; useful summary; filters; table/mobile equivalent              | `src/app/(internal)/admin/leads/page.tsx`                                                      |
| Internal detail  | Identity and status first; grouped facts; history; clearly separated authorized actions                     | `src/components/internal/bookings/booking-detail-view.tsx`                                     |

Do not add another shell inside a route already wrapped by one. Preserve one primary main landmark and one descriptive h1 per page. References demonstrate structure; the audit in the source work item lists defects that must not become templates.

## 3. Colors and tokens

Use existing semantic classes for ordinary UI:

| Purpose                | Current classes                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Page                   | `bg-background text-foreground`                                                                                 |
| Panel/card             | `bg-card text-card-foreground border-border`                                                                    |
| Secondary surface/text | `bg-muted text-muted-foreground`                                                                                |
| Overlay content        | `bg-popover text-popover-foreground`                                                                            |
| Focus/input            | `border-input`, visible `ring-ring` treatment                                                                   |
| Destructive action     | Existing Button `variant="destructive"` and destructive feedback                                                |
| Brand action           | `bg-brand text-brand-foreground`, `bg-brand-subtle text-brand-subtle-foreground`                                |
| Status                 | `bg-success`/`text-success`, `bg-warning`/`text-warning`, `bg-info`/`text-info` (each has a `-foreground` pair) |

`--brand`, `--brand-foreground`, `--brand-subtle`, `--brand-subtle-foreground`, `--success`, `--warning`, `--info` (and their `-foreground` pairs) exist in `src/app/globals.css` (`:root`, `.dark`, and the `@theme inline` mapping) as of Phase 1 of the source work item. `AppButton` (`src/components/common/app-button.tsx`) and `AppStatusBadge` (`src/components/common/app-status-badge.tsx`) already use them — reuse those components rather than reapplying the tokens by hand. Current shadcn `primary` remains neutral (not the blue brand color) and is unchanged; do not globally recolor it without a separately reviewed token migration. Avoid fresh hex values, arbitrary shadows, or page-specific palettes unless an approved media/chart requirement needs them. Document intentional fixed-color hero/image overlays.

**Not yet token-based:** `src/components/internal/shell/internal-shell.tsx` and `src/components/auth/auth-page-shell.tsx` still use hardcoded `blue-*`/`slate-*` classes instead of the tokens above — recoloring them is an open backlog item, not yet scheduled to a phase. Don't treat their existing hardcoded colors as the pattern to copy into new screens.

## 4. Typography, spacing, and shape

These are proposed defaults derived from current screens; match a sound neighboring pattern when it has a specific need.

| Role                | Default                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| Public hero title   | `text-4xl sm:text-5xl lg:text-6xl`, tight tracking; bold/black sparingly      |
| Page title          | `text-2xl sm:text-3xl font-bold tracking-tight`                               |
| Section title       | `text-xl sm:text-2xl font-semibold`                                           |
| Body                | Public `text-base leading-7`; compact internal `text-sm leading-6`            |
| Label               | `text-sm font-medium` or semibold                                             |
| Supporting metadata | `text-xs` only for genuinely secondary content; readable contrast             |
| Public container    | `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`                               |
| Internal page inset | `p-4 sm:p-6 lg:p-8`; avoid stacked large mobile insets                        |
| Spacing             | Prefer Tailwind steps 1, 2, 3, 4, 6, 8, 12, 16; consistent gaps within groups |
| Field/button radius | `rounded-xl` or existing `rounded-2xl` public form treatment                  |
| Panel radius        | `rounded-2xl`; preserve existing 2rem public feature cards where appropriate  |
| Badge radius        | `rounded-full`                                                                |

Prefer sentence case for labels and explanatory text. Reserve uppercase tracking for short eyebrows, not paragraphs. Use consistent number alignment in numeric columns. Do not truncate critical prices, statuses, or action labels. Long project names must remain available through wrapping or the detail page, not hover alone.

## 5. Component selection and composition

| Need                                | Reuse first                                                                                                   | Important limit                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public brand CTA                    | `common/app-button.tsx`                                                                                       | `appVariant`: `primary`, `soft`, `outline`, `ghost`, `destructive`; `appSize`: `default`/`sm`/`lg`/`icon`; `isLoading` shows a spinner and sets `aria-busy`                       |
| Compact, ghost, destructive action  | `ui/button.tsx`                                                                                               | Real variants/sizes only; AppButton's brand styling can conflict with destructive variants                                                                                        |
| Icon-only action                    | `common/app-icon-button.tsx`                                                                                  | Requires a typed `label` prop (renders as `aria-label`); never ship an icon-only control without it                                                                               |
| Input / textarea / label            | `ui/input.tsx`, `ui/textarea.tsx`, `ui/label.tsx`                                                             | Preserve accessible IDs, error linkage, and appropriate input attributes                                                                                                          |
| Search/select                       | `common/app-search-input.tsx`, `common/app-select.tsx`                                                        | `AppSelect` supports `ariaLabelledBy`, `ariaDescribedBy`, and `ariaInvalid`; do not assume any other arbitrary ARIA prop is forwarded                                             |
| Field error text                    | `common/app-field-error.tsx`                                                                                  | Give it a stable `id` and pass that id into the input's `aria-describedby`                                                                                                        |
| Status                              | `common/app-status-badge.tsx`                                                                                 | Tone is not the domain status; pass meaningful visible text; optional `dot` prop for a non-color status cue                                                                       |
| Empty state                         | `common/app-empty-state.tsx`                                                                                  | Use for empty lists/search results, not for errors                                                                                                                                |
| Error state (inline or route-level) | `common/app-error-state.tsx`, plus route `error.tsx` boundaries where a route can throw                       | Never render a raw stack trace; pass `onRetry` when a retry is meaningful                                                                                                         |
| Loading/skeleton                    | `common/app-loading-skeleton.tsx` (`AppSkeletonText`/`AppSkeletonCard`/`AppSkeletonRow`), route `loading.tsx` | Keep layout stable; no fake data                                                                                                                                                  |
| Skip link                           | `common/app-skip-link.tsx`                                                                                    | Target must match the page's main landmark `id` (see `public-shell.tsx`'s `id="main-content"`)                                                                                    |
| Dialog / mobile drawer              | `ui/dialog.tsx`, `ui/sheet.tsx`                                                                               | Use their title/description and focus behavior; do not hand-build a modal overlay — `AppConfirmButton`, `AppConfirmProvider`, and the internal shell's mobile nav already do this |
| Tabs, menus, table                  | Existing `ui` primitives                                                                                      | Preserve semantic markup and keyboard behavior                                                                                                                                    |
| Toast/confirmation                  | Existing app feedback APIs (`app-toast-provider.tsx` has a live region and a reduced-motion branch)           | Do not introduce a second global system; fix shared accessibility within approved scope                                                                                           |
| Project card / inventory / booking  | Existing public or internal domain component                                                                  | Preserve data contract, units, status, and authorized actions                                                                                                                     |
| Reveal                              | `common/app-reveal.tsx`                                                                                       | Decorative only; important content must remain available without animation                                                                                                        |

Use `cn` for class composition. Extend a shared variant when multiple callers need the same behavior; do not create another button/card framework. Native buttons are appropriate for specialized triggers when their semantics, focus, states, and dimensions are complete. Use Link for navigation and button for actions. `asChild` must wrap a single React element — a component that conditionally renders more than one child (like a loading spinner plus its label) must degrade to a single child when composed with `asChild`, or it breaks Radix `Slot`.

## 6. Responsive layout and navigation

Build from the narrow layout upward. Verify at 320, 390, 768, 1024, and 1440 CSS pixels as a project test matrix, plus content zoom. Grids stack naturally; use `min-w-0`, wrapping, and bounded media where needed. Do not hide overflow globally to conceal layout defects.

Keep existing public navigation at the `lg` transition and the internal desktop sidebar pattern unless the task explicitly changes navigation. On small screens, use `Sheet` with an accessible trigger, title, close control, Escape, focus containment/restoration, scrollable content, and closure on route selection (`SheetClose asChild` around the link) — both the public and internal shells already do this. Mark the active link with `aria-current="page"`. Provide a visible-on-focus skip link (`common/app-skip-link.tsx`) to the main content landmark; only add one where there is navigation to bypass (the single-panel `AuthPageShell` does not need one).

For wide operational tables, choose a mobile card/row view or an intentional scroll region with a visible cue and keyboard access. Retain table headers and accessible names. Keep key record identity and actions reachable; preserve filters, pagination, sorting, and query parameters where the existing route supports them. Do not invent unsupported server sorting or counts.

## 7. Forms and feedback

Every field has a persistent visible label. Show required/optional information in text or semantics, not color alone. Use suitable types, autocomplete, inputMode, and unit hints. Preserve raw values on failure. Validation on the client improves feedback; server validation remains authoritative.

Associate errors with the field through `aria-describedby` (pointing at an `AppFieldError`'s `id`) and `aria-invalid`; custom components that cannot forward these need a scoped, typed API extension (see `AppSelect`'s `ariaDescribedBy`/`ariaInvalid`), not an imaginary prop. For multi-field or server failures, keep a persistent message (an `AppFieldError`, or a small banner) in addition to a toast — do not rely solely on a disappearing toast. Move focus to the first invalid field when practical.

During submission, show a pending label and prevent duplicate submission (`AppButton`'s `isLoading` sets `aria-busy` and disables the button). Do not claim success until the server confirms. Preserve retryable input after network/server errors. Explain unavailable actions. Use `appToast` for supplementary feedback. Confirmation copy names the action and affected record and provides a safe cancellation path. UI confirmations never replace server authorization.

## 8. Required state matrix

Each applicable state must be designed and tested, or explicitly marked N/A with a reason. Reuse the shared components below instead of a one-off implementation.

| State                       | Expected presentation                                                                    | Reuse                                                |
| --------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Loading                     | Stable layout or skeleton; named progress where needed; no fake data or arbitrary delays | `AppLoadingSkeleton` primitives, route `loading.tsx` |
| Empty dataset               | Explain absence and offer a valid next step                                              | `AppEmptyState`                                      |
| Filter has no matches       | Retain filters; show reset/change-filter action                                          | `AppEmptyState` with a reset action                  |
| Validation failure          | Persistent specific error, field association, preserved values                           | `AppFieldError` + `aria-invalid`/`aria-describedby`  |
| Network/server failure      | Safe message and retry; no raw stack trace or success-looking empty list                 | `AppErrorState`, route `error.tsx`                   |
| Pending mutation            | Clear pending action, duplicates prevented                                               | `AppButton isLoading`                                |
| Success                     | Confirm actual outcome and meaningful next action                                        | —                                                    |
| Disabled/unavailable        | Explain why and how to proceed if possible                                               | —                                                    |
| Unauthorized/missing record | Respect server response and privacy; do not expose hidden record details                 | Route `not-found.tsx` where applicable               |
| Partial/missing media       | Stable fallback with truthful labels; usable project navigation                          | —                                                    |
| Stale/conflicting record    | Explain refresh/retry when server rejects an outdated action; never force success        | —                                                    |

## 9. Accessibility and motion

Target WCAG 2.2 AA as a design/verification goal, not a certification claim. Normal text should reach 4.5:1 contrast; large text 3:1; applicable non-text UI indicators 3:1. Verify real combinations, including overlays and both themes. WCAG's 24px minimum pointer target has exceptions; this project's proposed touch-friendly default is at least 44px for primary/mobile controls. Dense controls require deliberate spacing and verification. See the [W3C quick reference](https://www.w3.org/WAI/WCAG22/quickref/).

Use semantic headings, landmarks, lists, buttons, and table markup. Name icon-only controls (`AppIconButton`'s `label` prop); decorative icons should not repeat spoken text (mark them `aria-hidden="true"`). Do not convey a status only through color — `AppStatusBadge`'s `dot` prop is one option. Keep focus visible and unobscured by sticky UI. Verify keyboard operation, screen-reader announcements, 200% text zoom, and reflow. Maps and charts need meaningful textual/list alternatives.

Respect reduced motion for both Motion components and CSS transforms/transitions, using Tailwind's `motion-safe:`/`motion-reduce:` variants or Motion's `useReducedMotion()` hook (see `app-reveal.tsx`, `app-button.tsx`, `app-toast-provider.tsx`, `app-loading-skeleton.tsx`, `public-project-card.tsx` for the established pattern). Remove decorative translation, scaling, spring effects, and long reveals under that preference. Keep content visible and controls usable. Use explicit dismissal controls, never drag-only interaction. Avoid animation for critical status comprehension.

**Animation library:** use `motion` (already a dependency) for all new interactive/animated UI. Do not add Anime.js or another animation library — `motion` already covers spring/gesture/scroll/stagger with a first-class React reduced-motion hook, and a second animation runtime would add bundle cost for capabilities already available. See the dated research in the source work item's "dated trend research" section (and repository memory `ui-design-trends-2026-09.md`) before revisiting this decision.

## 10. Property content and domain truth

Show prices and units exactly as supported by existing formatters/contracts. Use MYR/RM consistently with the surface; identify monthly estimates as estimates and reuse existing calculator assumptions. Do not imply financing approval. Use Malaysia time and server-supported viewing slots. A viewing request is not a confirmed appointment.

Render published project information from the approved data path. Never invent a project price, availability count, discount, testimonial, agent identity, or promotional urgency to fill a layout. Distinguish unknown from zero. Preserve booking/payment/document status wording and server-authorized transitions. Hidden/disabled buttons are not authorization.

Consent remains required before marketing tracking. Use existing contact/link builders; creating a UI must not send customer messages. Engineering fixtures and screenshots use synthetic data and public assets only; no customer records, credentials, OTPs, or uploaded documents in agent context.

## 11. Framework, images, and performance

Keep server-rendered route composition and data access on the server; isolate interactive state/browser APIs in small Client Components. Send minimal serializable props across the boundary. Follow the installed Next.js guides for async route parameters, images, metadata, and route boundaries rather than older conventions.

Use Next Image with dimensions or a sized `fill` container, meaningful alt text, and accurate responsive `sizes`. Decorative images have empty alt text. Preserve deliberate `unoptimized` exceptions until their media constraints are understood. Do not preload every card image or add external hosts/packages casually. Measure the actual hero/LCP candidate. Avoid unnecessary client libraries and blocking animations.

Keep dynamic maps browser-bound as in the current implementation; maintain a useful project list and loading fallback. Charts require meaningful labels and non-color differentiation. Record performance comparisons when media, large lists, maps, or client boundaries change; do not invent benchmark results.

Route-level `loading.tsx`/`error.tsx`/`not-found.tsx` boundaries attach to an existing route segment without adding a new route and render inside the segment's layout (the shell stays mounted). `error.tsx` must be a Client Component (`"use client"`) per Next.js; `loading.tsx` and `not-found.tsx` can be plain server components. See `src/app/(public)/projects/`, `src/app/(public)/projects/[slug]/`, and `src/app/(internal)/admin/leads/` for the established pattern; other routes do not have these yet — add them for a route when its task involves that route, following the same pattern, rather than doing a repository-wide sweep in one change.

## 12. Completion checklist and evidence

- Confirm the declared persona, primary action, reference screen, reused components, and exact file manifest.
- Confirm theme tokens, readable text, spacing, responsive layout, no clipped actions, and appropriate visual hierarchy.
- Exercise the applicable state matrix, keyboard navigation, dialog focus, errors, labels, reduced motion, and both themes.
- Use synthetic screenshots for representative changed routes at mobile and desktop widths, plus problematic breakpoints and long-content states. Record route, viewport, theme, data state, and observation.
- Run calculator-listed checks. For source changes follow the repository's clean-CI matrix: installation, route type generation, formatting, lint, typecheck, tests, build, dependency/security checks, and relevant integration/accessibility checks. Separate inherited failures from introduced failures; a scoped pass does not prove full CI passes.
- Add meaningful behavioral tests for changed interaction contracts. Do not write tests that merely repeat class strings. Use browser/visual checks where layout is the actual concern.
- Provide evidence and a rollback procedure. Mark missing environments/checks as unverified, not passed. Obtain required independent/human review.

## 13. Ready-to-use task prompt

```text
Implement [UI task] for [persona] on [route].
Follow the repository SDLC and read docs/UI_DESIGN_GUIDE.md before editing.
Inspect the closest existing screen, its shell, tokens, and shared components.
Use [synthetic fixture or existing approved data contract].
Preserve domain rules and existing business behavior outside the request.
First state the scoped files, reused components, primary action, state matrix,
and responsive/accessibility checks. Apply the risk gate before mutation.
Implement within the authorized scope, verify the result, and report evidence,
unverified cases, and rollback. Do not invent component APIs or business data.
```

## 14. Maintenance and exceptions

Owner: PropertyGoJB product/engineering owner. Review when shared primitives, theme tokens, or major layout patterns change. An exception records the affected rule, user need, evidence, scope, owner, and validation. It is not permission to bypass SDLC or active business rules. Keep proven examples fresh; do not silently turn a proposed backlog item into current policy or a component that agents may assume exists.

**Known open backlog items (not yet implemented, do not assume otherwise):** `internal-shell.tsx` and `auth-page-shell.tsx` still use hardcoded colors instead of the tokens in section 3; no route outside `projects`/`projects/[slug]`/`admin/leads` has `loading.tsx`/`error.tsx`/`not-found.tsx` yet. See the source work item for the full audit and phase history.
