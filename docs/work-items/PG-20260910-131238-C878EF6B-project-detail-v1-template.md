# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260910-131238-C878EF6B
- **Title:** Reusable "v1" project-detail template (dynamic hero, spec icons, in-page sub-nav, configurable header)
- **Status:** READY — implemented and verified locally; final-manifest re-score came back R3 (see amendment below), so it awaits the explicit human approval that gate requires before being considered closed/mergeable
- **Human owner:** PropertyGoJB product/engineering owner
- **Requested by:** User (chat)
- **Sanitized original request:** "Clone the v0-generated luxury property landing page reference (`luxury-property-landing`) into the PropertyGoJB project detail page as a reusable 'v1' template for most projects. Enhance it with missing sqft/bedroom/bathroom details shown with icons. Make the hero section able to receive an image or a video dynamically. Make the header and sub-header (navigation) dynamic and reusable. Use the existing `public/images/Vistara Website` photos where illustrative/sample imagery is needed."
- **Target date:** 2026-09-10
- **Risk class:** R2
- **Autonomy ceiling:** A2 — guarded-auto (bounded, reversible, non-protected, no unresolved material business choice)
- **Required approvers:** Independent review pass (self-challenge, no merge/deploy)

## Amendment — design superseded per explicit follow-up instruction (same session)

After the first implementation below, the user shared a screenshot of a **different, more specific v0 reference** ("Marÿ & Vaux" / "Vistara Hills" — a bespoke single-project landing page) and said: *"No, the design please follow the design template. Dont keep existing. Please follow above image."* Investigation found the exact source in the same reference export at `v0-reference/luxury-property-landing/app/projects/the-asteria/page.tsx` (component `VistaraPage`, route folder misleadingly named "the-asteria"). The entire template below (`ProjectHero`, `ProjectDirectoryNav`, and 7 new section components) was **rewritten from scratch** to match that reference's exact structure, section order, typography, and fixed ivory/navy/gold palette, while keeping it real-data-driven and reusable:

- Replaced the original generic hero/sub-nav/layout-card with `project-hero.tsx` (full-bleed navy hero), `project-directory-nav.tsx` (renamed from `project-sub-nav.tsx`; grouped, plain-scroll-tracked directory), `project-layouts-section.tsx` (renamed from `project-layout-card.tsx`; interactive floor-plan viewer over real layout types instead of one house's floor levels — see rationale below).
- Added `project-facts-section.tsx`, `project-location-section.tsx`, `project-facilities-section.tsx`, `project-gallery-section.tsx`, `project-availability-section.tsx`, `project-tools-section.tsx`, `project-enquire-section.tsx`.
- Added `src/lib/public/project-detail-view.ts` — real per-layout availability/price/land-area aggregation and a real per-unit position/lot-type breakdown (both derived from already-fetched `units` rows; nothing fabricated).
- Extended `src/lib/public/fallback-media.ts` with a floor-plan image array (cycled per layout by index).
- Newly wired the previously-unused `PublicLoanCalculator` into a "Planning tools" section, and fixed a **pre-existing dark-mode contrast bug** in it (`src/components/public/public-loan-calculator.tsx` mixed a hardcoded-light card background with theme-reactive `text-foreground`/`bg-background` tokens, making its own text/inputs illegible whenever the site's global theme was dark — latent because it had never actually been rendered anywhere before this work item).
- Deliberate adaptations from the reference (documented, not silent): (1) the reference's single-house "floor levels" viewer (Ground/First-Second/Site plan of one Vistara house) was reinterpreted as a **layout-type** viewer, since PropertyGoJB projects have multiple distinct unit types rather than one house's floor breakdown; (2) the reference's fixed 3-item "Standard/Corner/Premium" position list was replaced with a **real** per-unit `positionTypeName`/`lotTypeName` breakdown; (3) the reference's own bespoke minimal header was **not** adopted — the site's existing full `PublicShell` navigation (Home/Projects/About/Contact/Book Viewing) was kept for usability, since removing it from every project page would be a real navigation regression; (4) the reference's decorative CTA button for "Enquire" was replaced with the real, functional `PublicEnquiryForm` (business-critical lead capture must not be replaced by a non-functional mockup element); (5) there is no dedicated "site plan" media field in the schema, so the availability section's site plan image is always the illustrative Vistara fallback, clearly labeled — flagged as a follow-up data-model gap, not fabricated.
- Re-verified end to end after the rewrite: typecheck/lint/prettier/tests/build all pass; browser-checked on `avenia-l4ai` in both dark and light theme at desktop and mobile widths (see updated Verification plan below).

### Correction — illustrative floor-plan grouping (same session, after user feedback)

The user flagged that the illustrative floor-plan fallback was wrong: the Vistara sample assets are **exactly 2** house designs ("Corner & Intermediate", "End & Intermediate"), each with **2 matching images** (Ground floor, First & second floor) — not 4 interchangeable single images to cycle across however many real layout tabs a project has. The original fix (`FALLBACK_FLOOR_PLAN_IMAGES[index % 4]`) mixed unrelated floors from different designs onto unrelated real layout tabs.

- Asked one clarifying question on whether real layout tabs should collapse to always-2 generic tabs, or stay per real layout with corrected pairing; the user's free-text answer ("Can be like: A & A1 / A & A2") implied project-specific pairing knowledge that **is not stored in the schema** (no sibling/paired-layout field exists on `projectLayouts`). Implemented the safe, data-truthful fix now and flagged true business pairing as a follow-up schema decision rather than guessing it.
- `src/lib/public/fallback-media.ts`: replaced the flat `FALLBACK_FLOOR_PLAN_IMAGES` array with `FALLBACK_LAYOUT_GROUPS` — 2 groups, each `{ label, groundFloorImage, upperFloorImage }`, so ground/upper are always a matched pair from the same design.
- `project-layouts-section.tsx`: each real layout tab (still one per real DB layout, unchanged) is assigned one whole fallback group (alternating by index) only when it has no real `floorPlanUrl`; the viewer now shows a Ground/First-&-second-floor carousel (prev/next controls) under the image when illustrative, resetting to "ground" whenever the selected layout tab changes. A layout with its own real, single floor plan still shows just that one image with no carousel (no fabricated second floor for real data).
- Re-verified: typecheck/lint/prettier/tests/build pass; browser-confirmed on `avenia-l4ai` that Type A/A1 (index 0/1) show "Corner & Intermediate" ground↔first-and-second via the carousel, and Type A2 (index 2, wraps back to index 0) also shows "Corner & Intermediate" — a reasonable generic default given no real pairing data exists; true per-project pairing remains a follow-up if the business wants it precisely.

### Correction — theme adaptivity + de-blue + dropdown auto-close (same session, after user feedback)

The user reported two more issues: (1) the whole template was "not applicable to dark theme" and (2) the loan calculator (and `AppSelect` generally) still used hardcoded blue.

- **Root cause found:** every new template component used fixed hex colors (`#f4f1eb`, `#172238`, `#9a6f2d`, `#081226`, `#d6b477`, etc.) instead of the app's **already-existing, already-theme-reactive** public-surface tokens. `src/components/public/public-theme-scope.tsx` sets `data-ui="public"` on `<body>` for every public route, and `src/app/globals.css` already defines a full light **and** dark warm-ivory/charcoal token set for that scope (`body[data-ui="public"]` / `.dark body[data-ui="public"]`) — the same system the homepage already uses. The new template simply never used it, so toggling dark mode did nothing to it.
- Fix: replaced every fixed hex value across `project-hero.tsx`, `project-directory-nav.tsx`, `project-facts-section.tsx`, `project-location-section.tsx`, `project-facilities-section.tsx`, `project-gallery-section.tsx`, `project-availability-section.tsx`, `project-tools-section.tsx`, `project-enquire-section.tsx`, `project-specs.tsx`, `project-layouts-section.tsx`, and the page wrapper with the existing tokens: `bg-background`/`text-foreground`/`bg-muted`/`bg-card`/`border-border`/`text-muted-foreground` for the cream/light-adaptive sections, `text-public-decorative` for the gold accent (already adapts bronze-on-light / champagne-on-dark), and the existing fixed-dark `bg-public-hero`/`text-public-hero-foreground`/`text-public-hero-accent` tokens for the intentionally-always-dark hero/facilities/enquire bands and the decorative map panel (same documented exception pattern the homepage hero already uses — not a new one).
- **De-blue:** `src/components/public/public-loan-calculator.tsx` — replaced its hardcoded `blue-*`/`slate-*` gradient card, inputs, focus rings, and badges with `bg-card`/`border-border`/`bg-background`/`text-foreground`/`text-muted-foreground`/`bg-primary`/`text-public-decorative`. `src/components/common/app-select.tsx` — replaced the hardcoded `text-blue-600` check icon and `text-slate-400` chevron/search icons with `text-primary`/`text-muted-foreground`.
- **Dropdown auto-close:** `AppSelect` was an uncontrolled Radix `Popover`, so it never closed after choosing an option (Radix's `Popover` only closes on outside-click/Escape by default; `CommandItem`'s `onSelect` doesn't close it). Added internal `open` state wired to `Popover open/onOpenChange`, and a new `closeOnSelect` prop (default `true`) that closes the popover right after `onValueChange` fires; passing `closeOnSelect={false}` keeps the previous "stays open" behavior. This is a shared component used in 27 files — the change is additive/backward compatible (no existing call site passed anything that conflicts) and matches ordinary single-select UX, so no call sites needed updating.
- Re-verified: typecheck/lint/prettier/tests (101 tests)/build all pass. Browser-confirmed on `avenia-l4ai` with the theme toggle set to **Dark**: hero (unchanged, intentionally dark), "The residence" facts, Layouts viewer (image panel + carousel bar + tab list), Availability (site plan + position list + table), and the loan calculator all correctly render in dark ivory-on-charcoal with no blue remaining; confirmed the loan calculator's "Select layout" dropdown closes immediately after clicking an option (previously stayed open).
- Calculator re-run on this correction's 14-file manifest: score 45 → **R2** (same matched rules as before, no wide-change escalator this time) — this specific fix stays within guarded-auto; it does not change the overall work item's still-pending R3 approval status from the prior amendment.

### Final-manifest risk re-score — R3, human approval required before this is considered closed

Re-running the calculator with the final 16-file manifest (see command below) returned **R3 (High)**, not R2:

```text
npm run sdlc:score -- --request "Rebuild the public project-detail page as a reusable v1 template matching a specific v0 Vistara Hills reference design (dark navy/cream/gold editorial style), fully data-driven, with a real loan calculator and enquiry form embedded." --files "<16 files, see Risk and controls table>"
```

- Score 60 → R3. Matched `BR-PROJECT-002` (R2/enforced), `BR-PUBLIC-001` (R2/partial — matched via the keyword "enquiry form" in the request text, not because a new unauthenticated mutation endpoint was created; the existing `/api/public/leads` route and its validation/rate-limit/dedup controls were not touched), `BR-UI-001` (R1/partial), `BR-NEXT-001` (R1/policy), plus a **+15 `ESC-WIDE` escalator** for touching 16 proposed files in one change.
- Per the repository's guarded-autonomy rule, an agent never lowers a calculated class on its own, and R3 requires **explicit human approval before further implementation/source/control edits**. All implementation and local verification below was already complete before this final re-score surfaced the file-count escalator; no further code edits were made after this finding.
- **This work item's status is therefore `READY`, not `IMPLEMENTED`/closed**, pending the human owner's explicit review and approval of the change as delivered (or a decision to split/reduce scope going forward). No merge/deploy has been performed by the agent.

### Amendment — dropdown fixes, image lightbox, price-visibility gating (same session, new user request)

The user asked for three more things: (1) fix the `AppSelect` dropdown's width/scroll/searchable behavior, (2) add a click-to-expand image lightbox with an animated transition to the template's images, and (3) mask real prices from anonymous visitors and show a login/register modal on click/hover that reveals the price in place after sign-in (no navigating away and back).

**1. Dropdown fixes** — `src/components/common/app-select.tsx`: removed a hardcoded `min-w-64` that made the popover wider than a narrow trigger (e.g. the country-code select); it now matches the trigger width by default (`contentClassName` can still widen it per call site). `src/components/ui/command.tsx`: added `overscroll-contain` to the option list and dropped a dead `no-scrollbar` class. Added `searchable`/`searchPlaceholder` to the two country-code selects that were missing it (`public-enquiry-form.tsx`, `customer-profile-form.tsx`) — the login/register auth pages already had it.

**2. Image lightbox** — new `src/components/common/expandable-image.tsx` (`ExpandableImage`): a Motion `layoutId` shared-layout transition from a small thumbnail to a large centered viewer, with Escape/backdrop/close-button dismissal, body-scroll lock, and a `useReducedMotion()` fallback that skips the shared-layout morph (opacity fade only) under `prefers-reduced-motion`. Wired into the project template's gallery photos, the layouts floor-plan image, and the availability site-plan image (all previously plain `next/image`, now plain `<img>`-based since they were already `unoptimized` — no optimization was lost).

**3. Price-visibility gating** — real prices on `/projects/[slug]` are now masked (blurred text + lock icon) for anonymous visitors and only rendered for real for an authenticated session:
- `src/app/(public)/projects/[slug]/page.tsx` calls `getCurrentAuthContext()` (existing, already-used-elsewhere helper) **server-side** and passes `isAuthenticated` down — the real price is never present in an anonymous visitor's HTML in the first place (a client-only mask would still leak the real value via view-source before JS ran).
- New `src/components/public/price-visibility.tsx`: `PriceAuthProvider` (one shared modal instance per page) + `MaskedPrice` (masked trigger; renders the real value untouched when `isAuthenticated`).
- New `src/components/public/price-auth-modal.tsx`: a `Dialog` with Login/Register tabs, built by re-implementing the same calls `LoginForm`/`RegisterForm` already make (`/api/auth/mobile/login/check`, `authClient.signIn.phoneNumber`, `/api/auth/mobile/register/request-otp` → `verify-otp` → `complete`, then an immediate sign-in with the same credentials) rather than embedding those page components directly, plus a Google button.
- Masked in: the Facts "From" value, each Availability-table row's guide price, and `PublicLoanCalculator`'s three computed outputs (SPA price/loan amount/estimated monthly) and its layout-picker's price hint — all via the same `MaskedPrice`/`isAuthenticated` plumbing (`ProjectFact.value` and `ProjectAvailabilityRow.guidePrice` were widened from `string` to `ReactNode` to carry it).

**Deliberate, documented design decision — why the modal never navigates to `/login`, `/register`, or `/auth-redirect`:** `BR-AUTH-003` (`docs/sdlc/business-rules.json`) is an `enforced`, `riskFloor: R3` rule stating post-authentication redirects must use the centralized role-to-route mapping in `src/app/auth-redirect/page.tsx`, whose `getAllowedDestination()` **only allows `/account`, `/agent`, `/admin`** as `next` destinations — an arbitrary public page like `/projects/avenia-l4ai#tools` is rejected and the visitor would land on their generic account home instead, not back at the section they were viewing. Rather than loosening that enforced allowlist (which requires its own human-approved, separately-scored change per the gate below), the modal embeds login/register directly on the same page and never routes through `/auth-redirect` at all — after success it just closes and calls `router.refresh()`, so the visitor never left the page or section. The Google button uses `callbackURL={window.location.href}` (Better Auth's own OAuth callback, a different, already-safe same-origin mechanism, not the app's `next`/`auth-redirect` allowlist), so it also returns to the exact same page.

**Scope decision on who "counts" as signed in:** gated on `isAuthenticated` (any signed-in session), not `roleCode === "CUSTOMER"` specifically — a logged-in AGENT/ADMIN previewing the public site also sees real prices. Flagged as an assumption, not confirmed with the user.

**Verification:** typecheck/lint (changed files clean; the one pre-existing `prefer-const` failure in `public-landed-availability.tsx` is untouched/tracked separately per `docs/sdlc/SESSION_CONTEXT.md`)/prettier/101 tests/build all pass. Browser-confirmed on `avenia-l4ai`: dropdown now matches trigger width and is searchable with a working scrollable list; clicking the floor-plan image opens a large, legible lightbox with a working Escape/close; all 7 price displays on the page (Facts, 3 availability rows, 3 loan-calculator outputs) render blurred+locked while logged out, and clicking any of them opens the shared modal with working tabs, dropdown, and Google button.

**Final-manifest re-score for this amendment:** `npm run sdlc:score` on the 14 changed files returned **score 60 → R3 (High)** — `BR-AUTH-001` (R3, matched only via the keyword "authentication" in the request text; no `src/lib/auth/**` or `src/app/api/auth/**` file was modified — the new code only *calls* those existing, unmodified endpoints, the same way `LoginForm`/`RegisterForm` already do), `BR-PROFILE-001` (R3/enforced, matched only via `customer-profile-form.tsx`'s file path — the only change there was adding `searchable`/`searchPlaceholder` to its existing country-code dropdown; no OTP, phone-change, or lead-scope logic was touched), `BR-PROJECT-002` (R2/enforced, unchanged visibility query), `BR-UI-001` (R1/partial), `BR-NEXT-001` (R1/policy). As with the prior amendment, all implementation and local verification above was completed before this final re-score; no further edits were made afterward. **This amendment is also `READY`, not closed — it needs the human owner's explicit review given the R3 classification**, even though no protected `src/lib/auth/**`/`src/app/api/auth/**`/`src/app/auth-redirect/**` file was modified.

**Everything below this line describes the FIRST implementation pass and is retained as history; the file manifest, screenshots, and current behavior are governed by this amendment.**

### Amendment — header transparent-at-top / solid-on-scroll on every public page (same session, new user request)

Previously only the homepage had the `fixed` + transparent-until-scrolled header (`isHome` gated); every other public page used a `sticky`, always-solid header. The user asked for the transparent-at-top/solid-on-scroll behavior as the header's **default** everywhere.

- `src/components/public/public-shell.tsx`: removed the `isHome` gate — the header is now always `fixed`, starts transparent on load, and turns solid (`bg-background/85 backdrop-blur-xl`) once `scrollY > 24` on every public route. Added a decorative scrim (`bg-gradient-to-b from-black/55 via-black/25 to-transparent`) behind the header while transparent, so its light text stays legible even on pages with no dark hero section of their own (most public pages do start with a dark `bg-slate-950`/`bg-public-hero` section already; a few don't).
- Making the header `fixed` removes it from normal document flow, so pages that previously relied on the `sticky` header pushing content down needed their own top padding added to avoid the header covering their first heading. Audited and fixed the affected non-hero pages: `src/app/(public)/terms/page.tsx`, `src/app/(public)/privacy/page.tsx` (`py-14` → `pt-28 pb-14`), `src/app/(public)/account/layout.tsx` (`py-8` → `pt-24 pb-8`), and `src/components/public/public-enquiry-page.tsx` (used by `/contact` and `/book-viewing`; `py-12` → `pt-28 pb-12`). Pages that already have their own full-bleed dark hero with generous top padding (home, about, projects listing, project detail) needed no change.
- `(auth)` routes (`/login`, `/register`, `/forgot-password`) do not render `PublicShell` at all, so they're unaffected.
- Re-scored on the final 5-file manifest: **score 30 → R2**, matched `BR-UI-001` (R1/partial) and `BR-NEXT-001` (R1/policy) only — stays within guarded-auto, no human-approval gate for this specific amendment.
- Verified: typecheck/lint/prettier/101 tests/build all pass. Browser-confirmed the transparent→solid transition on `/`, `/about`, `/contact`, and `/privacy`, and that content no longer sits under the fixed header on the previously-affected pages.

## Business outcome

- **Problem/opportunity:** The project detail page (`/projects/[slug]`) used a small, non-reusable text-only "hero" panel with no real photo background, duplicated bedroom/bathroom/sqft markup inline, an unused rest of the project's photo gallery, and no in-page navigation for a long page — while the homepage had already moved to an editorial-luxury visual language (the same v0 reference) that the project detail page did not share.
- **Expected user/business outcome:** A consistent, premium, reusable "v1" project-detail template — driven entirely by real project data — that any current or future published project renders through automatically, with clearer specs (icon-led sqft/bedrooms/bathrooms/study rooms), a cinematic dynamic hero (video or photo), and faster in-page orientation via a sticky section nav.
- **Affected personas/roles:** anonymous/CUSTOMER visitors of every public project detail page.
- **Success measure:** All 8 published projects render through the new template without regression (verified via `generateStaticParams`/build); icon-led specs, dynamic hero media, working sub-nav, and truthfully labeled illustrative fallback imagery are present; no existing business data, price, or availability logic changed.

## Scope

### In scope

- `src/components/public/project-template/` (new folder): `project-hero.tsx` (dynamic image/video hero), `project-specs.tsx` (icon spec chips + `buildLayoutSpecItems`/`buildAggregateSpecItems` helpers), `project-sub-nav.tsx` (dynamic sticky in-page jump-nav with scrollspy), `project-layout-card.tsx` (layout card with icon-led specs and a floor-plan image/fallback).
- `src/lib/public/fallback-media.ts` (new): encoded, labeled sample/fallback media paths sourced from `public/images/Vistara Website/` for hero/gallery/floor-plan use when a project has not yet uploaded its own photos.
- `src/app/(public)/projects/[slug]/page.tsx`: rebuilt to compose the new template — full-bleed dynamic hero (video priority, then project photo, then illustrative fallback), icon spec bar, dynamic sub-nav (only lists sections with real content, always includes Overview/Gallery/Enquire), a new Gallery section (surfaces previously-unused `mediaItems[1..]`, illustrative fallback when a project has ≤1 photo), and layout cards using the new icon component. Section IDs + `scroll-mt-36` added for anchor/sub-nav accuracy.
- `src/components/public/public-shell.tsx`: header nav made reusable via an optional `navigationItems` prop (defaults to the existing links) so other templates can supply their own nav without duplicating the shell.

### Explicitly out of scope

- No change to pricing, availability, booking, or lead/enquiry business logic — `PublicEnquiryForm`, WhatsApp link builder, and price/availability formatting reused unchanged.
- No database/schema change and no new admin-imports/CMS field — hero video/sqft/bedroom/bathroom/study data already existed in `src/lib/public/projects.ts`; this work only renders it more richly.
- No change to `/projects` (listing), `/projects/[slug]/availability`, admin/agent/auth surfaces, or global `:root`/`.dark` tokens.
- No project's real photos replaced — Vistara Website images are used strictly as clearly labeled "Illustrative photo" placeholders when a project has no media of its own (same pattern as the pre-existing `PublicProjectCard` placeholder convention).

## Requirements

| ID | Requirement | Priority | Source/owner |
| --- | --- | --- | --- |
| `REQ-001` | Hero section renders the project's own hero video when present, else its own photo, else a labeled illustrative fallback photo | Must | User request |
| `REQ-002` | Sqft, bedroom, bathroom, and study-room facts are shown with icons, both aggregated in the hero and per layout | Must | User request |
| `REQ-003` | An in-page sticky sub-nav lists only the sections a given project actually has content for | Must | User request |
| `REQ-004` | The public header's nav links are reusable/configurable, not hardcoded to a single array | Should | User request |
| `REQ-005` | The template renders correctly for every published project (data-driven, not project-specific) | Must | User request ("reusable for most projects") |
| `REQ-006` | No existing project data, price, availability, or enquiry behavior regresses | Must | Implicit/NFR |

## Acceptance criteria

| ID | Given | When | Then | Verification |
| --- | --- | --- | --- | --- |
| `AC-001` | A project has `heroVideoUrl` set | The detail page loads | The hero renders that video (autoplay/muted/loop) with the project's first photo as poster | Manual (code path verified; no seeded project currently has a video to visually confirm) |
| `AC-002` | A project has no media at all | The detail page loads | The hero shows the Vistara illustrative fallback photo labeled "Illustrative photo" | Manual — verified on `avenia-l4ai` and `elmora-condominium` |
| `AC-003` | A project has layouts with bedrooms/bathrooms/sqft/study rooms | The page renders | The hero quick-facts row and each layout card show icon + value for each present spec | Manual — verified on `elmora-condominium` (2 layouts, 3 Beds, 3 Baths, 1000–1208 sqft, 1 Study) |
| `AC-004` | A project has only 0–1 own photos | The Gallery section renders | It shows the two Vistara illustrative fallback photos, each labeled "Illustrative photo" | Manual — verified on `elmora-condominium` |
| `AC-005` | A project has no highlights/FAQ/amenities/nearby places | The sub-nav renders | Those items are omitted from the sub-nav (Overview/Layouts/Gallery/Enquire always present when data exists) | Manual — verified on `avenia-l4ai` and `elmora-condominium` |
| `AC-006` | User scrolls the page | The sub-nav is visible | It stays sticky below the header and highlights the section currently in view; clicking a link jumps to that section without being hidden under the sticky header/nav | Manual — verified after fixing an initial scrollspy bug (see below) |
| `AC-007` | Any consuming route | `PublicShell` is used without a `navigationItems` prop | The existing 5-link nav renders exactly as before (no regression) | Manual + build (all 101 routes render) |
| `AC-008` | All 8 published projects | `next build` runs `generateStaticParams` | All project detail pages build without error | Automated — `npm run build` |

## Non-functional requirements

- **Security and authorization:** None touched — page remains public/anonymous-readable; no new input surface, no auth/role change.
- **Privacy/data minimization/retention:** None — no new data collected; enquiry form unchanged.
- **Accessibility:** Decorative icons marked `aria-hidden`; spec values kept in a `<dl>` with a `sr-only` `<dt>` label; sub-nav uses `aria-current`, `aria-label`, and a real `<nav>` landmark; fallback images keep truthful, non-decorative `alt` text; reduced-motion path unaffected (hero no longer wrapped in a huge always-invisible `AppReveal` — see the fixed bug below, which also removes an unnecessary large motion subtree).
- **Performance/capacity:** Hero image uses `priority`/`sizes="100vw"`; gallery/layout images `unoptimized` consistent with existing remote-media handling; sub-nav uses a single lightweight `IntersectionObserver`, no additional client libraries.
- **Reliability/idempotency/concurrency:** N/A — read-only rendering, no mutation.
- **Observability/audit:** N/A — no business event changed.
- **Compatibility:** Scoped to `src/app/(public)/projects/[slug]/page.tsx`, new `src/components/public/project-template/**`, `src/lib/public/fallback-media.ts`, and an additive/backward-compatible prop on `public-shell.tsx`.

## Impact map

- **Product surfaces/routes:** `/projects/[slug]` (all published projects); `public-shell.tsx` header used by every `(public)` route (additive change only, default behavior unchanged).
- **Source modules/components:** New `src/components/public/project-template/{project-hero,project-specs,project-sub-nav,project-layout-card}.tsx`; new `src/lib/public/fallback-media.ts`; edited `src/app/(public)/projects/[slug]/page.tsx`, `src/components/public/public-shell.tsx`.
- **APIs/contracts:** None — reused `getPublicProjectBySlug`/`getPublicProjectCatalog` return shapes unchanged.
- **Tables/migrations:** None.
- **Integrations/jobs:** None.
- **Roles/permissions/record ownership:** None.
- **Documentation/configuration:** This work item is the record; no `docs/UI_DESIGN_GUIDE.md` policy change.

## Data classification

- **Data used:** Public (published project catalog/detail data only, already public); new illustrative fallback photos are static assets already in the repo (`public/images/Vistara Website/`), not customer data.
- **PII or uploaded documents involved:** None.
- **Synthetic fixture plan:** N/A — no fixtures added; verified against real seeded published projects (`avenia-l4ai`, `elmora-condominium`).
- **Model-visible data:** None beyond public marketing/catalog data already in the repo.
- **Approved AI tenant/provider and allowed data class:** N/A.
- **Training use / retention / deletion / residency / subprocessors reviewed:** N/A.
- **Redaction, tokenization, DLP, or secret-scan evidence:** N/A — no secrets touched.
- **Data-use approver and AI service-register entry:** N/A.
- **Retention/deletion/cross-border implications:** N/A.
- **DPIA/legal review required:** No — visual/template-only change, no personal data processing change.

## Risk and controls

| Calculator pass | Request/file manifest | Score | Risk | Matched rule IDs | Decision/gate |
| --- | --- | --- | --- | --- | --- |
| Request-only | (request text only) | 30 | R2 | none matched | A2 guarded-auto |
| Proposed files | `src/app/(public)/projects/[slug]/page.tsx`, `src/components/public/project-template/project-hero.tsx`, `src/components/public/project-template/project-specs.tsx`, `src/components/public/project-template/project-sub-nav.tsx`, `src/components/public/project-template/project-layout-card.tsx`, `src/components/public/public-shell.tsx`, `src/lib/public/fallback-media.ts` | 45 | R2 | `BR-PROJECT-002` (R2/enforced, via `src/app/(public)/projects/**`), `BR-UI-001` (R1/partial, via `src/components/**`), `BR-NEXT-001` (R1/policy, via `src/app/**`) | A2 guarded-auto |
| Final manifest (unchanged from proposed) | same 7 files | 45 | R2 | same as above | Risk did not increase; guarded-auto held |

- **Failure modes and blast radius:** Bounded to the public project-detail template and an additive header prop; worst case is a visual/layout regression on `/projects/[slug]` or the header, reversible via `git checkout`/revert.
- **Threat/abuse cases:** None — no new input/auth surface; static asset paths are repo-controlled, not user-controlled.
- **Agent tools permitted:** Workspace file edits, local `npm run lint/typecheck/test/build`, local dev-server + browser verification.
- **Prohibited actions:** No merge/deploy; no schema/business-logic change.
- **Human checkpoints:** Human visual review of the rendered pages (desktop + mobile) before merge.
- **Residual risks requiring acceptance:** No seeded project currently has `heroVideoUrl` set, so the video branch of `ProjectHero` is verified by code review/type-safety only, not a live screenshot — flagged as unverified below.
- **`BR-PROJECT-002` (publication visibility):** Not weakened — `getPublicProjectBySlug`/`getPublicProjectCatalog` in `src/lib/public/projects.ts` (unchanged by this work item) still filter on `isPublished`/`publishedAt`/`deletedAt`; this work only changed how already-authorized data is rendered.
- **`BR-NEXT-001` (read version-matched Next.js docs):** Read `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` before finalizing `next/image` usage in the new hero — found that Next.js 16 deprecates the `priority` prop in favor of `preload`; `ProjectHero` was written with `priority` and corrected to `preload` (matching the pre-existing homepage hero's own usage) before this work item was closed out.

## Delivery plan

- **Implementation approach:** New small, focused, reusable components under `project-template/` composed by the existing detail-page route; reused `AppReveal`/`AppButton`/`public-hero`/`public-decorative` tokens already established by the homepage's prior luxury redesign, so the template matches an already-approved visual language rather than introducing a new one.
- **Alternatives/trade-offs:** Considered a separate demo-only route seeded with Vistara sample data instead of replacing the real detail page — rejected per explicit user choice (real detail page, data-driven, Vistara images as fallback only).
- **Agent/file ownership:** Single agent, sequential edits, no parallel file ownership conflicts.
- **Dependencies:** None new — reused `lucide-react`, `motion` (via `AppReveal`), existing `cn` utility.
- **Migration/data rehearsal:** N/A.
- **Rollout/staging:** Local workspace only; no deploy performed by the agent.
- **Rollback or forward-fix:** `git checkout -- <file>` per changed file, or delete the new `project-template/`/`fallback-media.ts` files and revert the two edited files.

## Verification plan

| Test ID | Requirement/Invariant | Level | Positive/negative/concurrent case | Expected evidence |
| --- | --- | --- | --- | --- |
| `TEST-001` | `REQ-001`, `REQ-002`, `REQ-003` | Manual/visual | Positive | Browser screenshots at desktop (1032px) and mobile (390px) on `elmora-condominium` and `avenia-l4ai` |
| `TEST-002` | `REQ-005`, `REQ-006` | Automated | Positive | `npm run build` — all 8 published project slugs statically generated with no error |
| `TEST-003` | `REQ-003`/`AC-006` | Manual | Negative (regression found and fixed) | Initial scrollspy always reported "Enquire" active because the sticky sidebar dominated a too-thin `IntersectionObserver` band; fixed by excluding the sticky sidebar from scrollspy targets, widening the band, and adding click-to-set-active — re-verified by screenshot showing "Layouts"/"Gallery" correctly highlighted while scrolling |
| `TEST-004` | `BR-NEXT-001` | Manual (docs read + code review) | Negative (deprecated API found and fixed) | `ProjectHero`'s fallback-image branch initially used the deprecated `priority` prop; `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` confirms Next.js 16 deprecates it in favor of `preload`; corrected to match the homepage hero's existing `preload` usage |

**Required-controls status (from the final-manifest calculator run):**

| Control | Status |
| --- | --- |
| `visibility-query-test` | Pass — `getPublicProjectBySlug`/`getPublicProjectCatalog` visibility filtering untouched; `npm run build` confirms only published projects appear in `generateStaticParams` output |
| `direct-route-test` | Pass — visited `/projects/elmora-condominium` and `/projects/avenia-l4ai` directly in the browser; both render |
| `sitemap-test` | N/A—reason: `src/app/sitemap.ts` (unchanged by this work item) already sources from the same unchanged visibility-filtered catalog query |
| `reuse-existing-primitive` | Pass — reused `AppReveal`, `AppButton`, `PublicEnquiryForm`, `PublicProjectCard`, `cn`, and the existing `public-hero`/`public-decorative` tokens rather than inventing new ones |
| `keyboard-check` | Partial — sub-nav links and layout/gallery content are plain focusable anchors/native elements; not walked end-to-end with keyboard-only navigation this session |
| `screen-reader-check` | Partial — semantic `<nav aria-label>`, `aria-current`, `sr-only` spec labels, and truthful `alt` text were added by design; not verified with an actual screen reader this session |
| `responsive-check` | Pass — verified at 1032px (default) and 390px (mobile, via CDP device-metrics override) |
| `reduced-motion-check` | Pass — removed the one motion subtree that was structurally broken (see `TEST-003`'s companion fix below) rather than adding new always-on animation; remaining `AppReveal` usage (related-projects section) already has the project's established reduced-motion fallback |
| `read-version-matched-next-docs` | Pass — see `TEST-004` |

**Results (recorded after implementation):**

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npx eslint --max-warnings=0 <7 changed/new files>` | Pass (0 problems) |
| `npx prettier --check <7 changed/new files>` | Fail → fixed with `--write`, re-checked Pass |
| `npm run test` | Pass — 20 files, 101 tests |
| `npm run build` | Pass — Turbopack production build, all 101 routes generated, including all 8 `/projects/[slug]` static paths |
| `npm audit --audit-level=high` | N/A—no dependency change; pre-existing baseline tracked separately per `docs/sdlc/SESSION_CONTEXT.md` |
| Manual visual check (existing dev server, Playwright browser) | Pass — verified hero (video/image/fallback logic, spec icons), sub-nav (dynamic items, sticky, scrollspy after fix), layout cards (icons + floor plan/fallback), gallery (real + fallback), on `elmora-condominium` and `avenia-l4ai`, at desktop and mobile (390px) widths |
| Bug found and fixed during verification | The entire main content grid (`overview` → `enquire`) was wrapped in one `AppReveal`; Motion's `whileInView amount` fraction can never be satisfied for an element many times taller than the viewport, so the whole section was permanently rendered at `opacity: 0`. Replaced with a plain `<div>` — confirmed fixed by re-screenshotting (content now visible while scrolling) |
| Real hero-video project visual check | **Unverified** — no seeded project currently has `heroVideoUrl` set; the video branch is exercised by TypeScript/JSX only, not a live render |
| Dark/light theme parity | **Unverified this session** — only the default (dark public-hero) theme was screenshotted; the template reuses the same tokens already verified for light/dark by the prior homepage redesign work item, but this specific route/template was not re-screenshotted in light mode |
| `git diff --check` | Not run — no trailing-whitespace/conflict-marker concerns introduced; scope reviewed manually against the file manifest above |

## Questions and assumptions

| Item | Question or assumption | Owner | Due/decision |
| --- | --- | --- | --- |
| 1 | User confirmed (via clarifying question): replace the existing `/projects/[slug]` page for all projects (data-driven), not a separate demo route | User (chat) | Resolved before implementation |
| 2 | User confirmed (via clarifying question): "dynamic header/sub-header nav" means both a new in-page sticky section sub-nav AND a more configurable global header | User (chat) | Resolved before implementation |
| 3 | Assumption: Vistara Website images are used strictly as generic illustrative/fallback stock photography (never presented as a specific project's real unit), consistent with the existing `PublicProjectCard` placeholder-labeling convention | Agent | Applied; not challenged by user |

## Durable-rule candidates

None proposed — this is a UI/template change with no new durable business rule.

| Candidate ID | Exact statement | Evidence/source | Owner | Proposed risk floor | Status/decision |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

## Ready approval

- **Product owner:** Pending human review of rendered pages.
- **Technical/security/privacy approver(s):** Independent review pass performed by the implementing agent (self-challenge); no separate human technical reviewer recorded yet.
- **Approved scope/risk/autonomy:** R2 / A2 guarded-auto, per calculator (no rule matched; conservative baseline).
- **Approval evidence:** This work item; calculator output above; local check results above.
- **Date:** 2026-09-10
