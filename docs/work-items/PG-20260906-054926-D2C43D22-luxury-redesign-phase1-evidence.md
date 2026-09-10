# PG-20260906-054926-D2C43D22 — Luxury redesign Phase 0+1 evidence

- **Status:** IMPLEMENTED — Phase 0 (inspect) + Phase 1 (theme foundation + public homepage reference) only. Phase 2 not started.
- **Human owner:** PropertyGoJB product/engineering owner.
- **Sanitized original request:** Implement the PropertyGoJB visual redesign in `docs/PROPERTYGOJB_LUXURY_REDESIGN_COPILOT_BRIEF.md` — Phases 0–1 only (theme foundation + complete public homepage reference: shell, hero, search, project cards, shared controls), recording the brief's warm ivory/charcoal/champagne direction as a task-scoped exception to the existing blue/slate UI guide. Preserve accessibility, both themes, portaled overlays, business behavior; no new dependencies; no invented data.
- **Risk class (final):** R2 (Moderate), guarded-auto (A2). No file in the final manifest matched an R3+ gate; `src/components/public/marketing-consent.tsx` was excluded from scope specifically because touching it matched `BR-CONSENT-001` (R3) — see "Explicitly deferred" below.
- **Governance followed:** `.github/skills/propertygojb-agentic-sdlc/SKILL.md`, `docs/sdlc/SESSION_CONTEXT.md`, `docs/sdlc/business-rules.json`, `docs/UI_DESIGN_GUIDE.md`.

## 1. Scope actually delivered

- Public-scoped warm ivory/charcoal/champagne theme tokens (`body[data-ui="public"]`, both light/dark pairs), isolated from admin/agent's existing neutral tokens.
- Complete homepage rewrite per the brief's recipe: charcoal fixed hero with a real (or truthfully-fallback) project photo, single opaque search panel, restrained trust/guidance rows, simplified buyer-journey list, calm enquiry close.
- `PublicShell` (header/footer) and `PublicProjectCard` retokenized off blue/slate.
- `AppButton`'s hard-coded blue primary shadow removed.
- Theme-flash-before-hydration fix (inline script + layout-effect pairing) for the new public-only token scope.
- 1024px header horizontal-overflow fix (breakpoint-scoped padding/gap only).
- WCAG contrast regression found and fixed (`--public-decorative` light value, was 2.61:1, now 5.59:1).

**Not done (explicitly deferred, in scope for Phase 2+):** listing/detail pages, remaining public pages, auth/account, admin, agent. See the brief's phase table.

## 2. Risk scoring history (all runs, in order)

| #   | Command (abridged `--request`)                                        | Files                                                                | Result                                                                                      |
| --- | --------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Phase 0+1 request-only                                                | —                                                                    | R2, guarded-auto                                                                            |
| 2   | Phase 0+1 exact files (incl. `marketing-consent.tsx`)                 | 10 files                                                             | **R3** — `BR-CONSENT-001` matched via `marketing-consent.tsx` path; file dropped from scope |
| 3   | Phase 0+1 exact files (without `marketing-consent.tsx`)               | 9 files                                                              | R2, guarded-auto — implemented                                                              |
| 4   | Theme-flash fix                                                       | `inline-script.tsx`, `public-theme-scope.tsx`, `(public)/layout.tsx` | R2, guarded-auto                                                                            |
| 5   | Theme-flash fix incl. root layout (`suppressHydrationWarning` needed) | + `src/app/layout.tsx`                                               | R2, guarded-auto — implemented                                                              |
| 6   | Header overflow fix                                                   | `public-shell.tsx`                                                   | R1, low — implemented                                                                       |
| 7   | Contrast token fix                                                    | `globals.css`                                                        | R2, guarded-auto — implemented                                                              |

No run was ever downgraded by the agent; run 2's R3 was resolved by narrowing scope, not by overriding the gate.

## 3. Complete contrast table (measured, not estimated)

Method: real `getComputedStyle` values sampled from the running app (`localhost:3000`), not hand-computed hex math. Corrected mid-session after finding that Tailwind v4's `/NN` opacity modifier on a CSS-variable color compiles to `oklab(L a b / alpha)` (not `rgb()`), and that several elements sit under multi-layer semi-transparent backgrounds (e.g. `bg-muted/40` over the page background). The reported ratios below use full OKLab→linear-sRGB conversion (Björn Ottosson matrices) and Porter-Duff "over" compositing through every ancestor background layer, not a single-layer approximation. An earlier single-layer attempt mis-measured one element (false 4.18:1 for trust-section body text); the corrected value is 6.45:1 dark / 5.69:1 light.

### Light theme

| Element / state                                                           | Rendered fg                 | Rendered bg (fully composited)                          | Size / weight      | Ratio    | Required | Result                     |
| ------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------- | ------------------ | -------- | -------- | -------------------------- |
| Hero H1                                                                   | rgb(244,241,234)            | rgb(37,38,34)                                           | 60px / 500         | 13.5     | 4.5      | Pass                       |
| Hero subcopy (`/80` opacity text)                                         | rgb(244,241,234) composited | rgb(37,38,34)                                           | 18px / 400         | 13.5     | 4.5      | Pass                       |
| Header nav "Home" (active pill)                                           | rgb(244,241,234)            | rgb(27,28,25)                                           | 14px / 600         | 15.18    | 4.5      | Pass                       |
| Header nav "Projects" (inactive)                                          | rgb(91,89,79)               | rgb(244,241,234)                                        | 14px / 600         | 6.23     | 4.5      | Pass                       |
| Header eyebrow "Johor Bahru Property Desk"                                | rgb(122,90,48)              | rgb(244,241,234) (blurred `bg-background/85`, resolved) | 11.5px / 700       | **5.59** | 4.5      | Pass (was 2.61 before fix) |
| Section eyebrow "Featured Projects" / "Why PropertyGoJB" / "Get in touch" | rgb(122,90,48)              | rgb(244,241,234)                                        | 14px / 700         | **5.59** | 4.5      | Pass (was 2.61 before fix) |
| Trust-section body text (benefit description)                             | rgb(91,89,79)               | rgb(236,231,218) (`bg-muted/40` over page bg)           | 14px / 400         | 5.69     | 4.5      | Pass                       |
| Project card title                                                        | rgb(27,28,25)               | rgb(249,247,242)                                        | 20px / 600         | 15.99    | 4.5      | Pass                       |
| Project card metadata (location/type/units)                               | rgb(91,89,79)               | rgb(249,247,242)                                        | 14px / 400         | 6.57     | 4.5      | Pass                       |
| Primary button "Browse Projects"                                          | rgb(27,28,25)               | rgb(244,241,234)                                        | 18px / 600         | 15.18    | 4.5      | Pass                       |
| Outline button "WhatsApp Enquiry" (on hero)                               | rgb(244,241,234)            | rgb(37,38,34)                                           | 18px / 600         | 13.5     | 4.5      | Pass                       |
| Footer body text                                                          | rgb(27,28,25)               | rgb(244,241,234)                                        | 16px / 700         | 15.18    | 4.5      | Pass                       |
| Focus ring vs background (non-text)                                       | `#8A6A3E`                   | `#F4F1EA`                                               | n/a                | 4.42     | 3.0      | Pass                       |
| Champagne View-pill hover text vs fill                                    | `#1B1C19`                   | `--public-hero-accent` `#D5C09A`                        | 14px / 700 (badge) | 9.65     | 4.5      | Pass                       |

### Dark theme

| Element / state                     | Rendered fg      | Rendered bg (fully composited)             | Size / weight | Ratio | Required | Result |
| ----------------------------------- | ---------------- | ------------------------------------------ | ------------- | ----- | -------- | ------ |
| Hero H1                             | rgb(244,241,234) | rgb(37,38,34)                              | 60px / 500    | 13.5  | 4.5      | Pass   |
| Header nav "Home" (active pill)     | rgb(27,28,25)    | rgb(244,241,234)                           | 14px / 600    | 15.18 | 4.5      | Pass   |
| Header nav "Projects" (inactive)    | rgb(184,179,164) | rgb(27,28,25)                              | 14px / 600    | 8.17  | 4.5      | Pass   |
| Header eyebrow                      | rgb(213,192,154) | rgb(27,28,25)                              | 11.5px / 700  | 9.65  | 4.5      | Pass   |
| Section eyebrows                    | rgb(213,192,154) | rgb(27,28,25)                              | 14px / 700    | 9.65  | 4.5      | Pass   |
| Trust-section body text             | rgb(184,179,164) | rgb(46,47,41) (`bg-muted/40` over page bg) | 14px / 400    | 6.45  | 4.5      | Pass   |
| Project card title                  | rgb(244,241,234) | rgb(36,37,33)                              | 20px / 600    | 13.67 | 4.5      | Pass   |
| Project card metadata               | rgb(184,179,164) | rgb(36,37,33)                              | 14px / 400    | 7.36  | 4.5      | Pass   |
| Primary button "Browse Projects"    | rgb(27,28,25)    | rgb(244,241,234)                           | 18px / 600    | 15.18 | 4.5      | Pass   |
| Outline button "WhatsApp Enquiry"   | rgb(244,241,234) | rgb(37,38,34)                              | 18px / 600    | 13.5  | 4.5      | Pass   |
| Footer body text                    | rgb(244,241,234) | rgb(27,28,25)                              | 16px / 700    | 15.18 | 4.5      | Pass   |
| Focus ring vs background (non-text) | `#D5C09A`        | `#1B1C19`                                  | n/a           | 9.65  | 3.0      | Pass   |

**Regression found and fixed:** `--public-decorative` (champagne, used as eyebrow text in 5 places: header + 3 homepage section eyebrows + enquiry-form label) measured **2.61:1** in light mode with the brief's starting hex value `#B1925F` — a genuine WCAG AA failure for normal-weight-adjacent small text (11.5–14px, does not qualify as "large text"). Fixed by deepening the light-mode value to `#7A5A30` in `src/app/globals.css` (dark-mode value `#D5C09A` was already compliant at 9.65:1 and untouched).

## 4. Responsive widths (final state, fresh dev server)

| Width  | Horizontal overflow (`scrollWidth − clientWidth`) |
| ------ | ------------------------------------------------- |
| 320px  | 0px                                               |
| 390px  | 0px                                               |
| 768px  | 0px                                               |
| 1024px | 0px (was 26px before the header padding/gap fix)  |
| 1440px | 0px                                               |

Fix: `src/components/public/public-shell.tsx` nav-link and header auth-button horizontal padding/gap tightened only for the `lg`–`xl` range (`px-4`→`px-3 xl:px-4` on nav links; `gap-3`→`gap-2 xl:gap-3` and `px-5`→`px-4 xl:px-5` on the auth-button group), restored to original spacing at `xl:` (1280px+). No link or button removed; no behavior change.

## 5. Exact verification commands and exit codes (final state)

| Command                                        | Exit code | Result                                                                                                                                                                                                                 |
| ---------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                            | 0         | Pass                                                                                                                                                                                                                   |
| `npm exec next typegen`                        | 0         | Pass                                                                                                                                                                                                                   |
| `npm exec prettier -- --check <changed files>` | 0         | Pass                                                                                                                                                                                                                   |
| `npm run lint -- --max-warnings=0`             | **1**     | **Fail — inherited.** `prefer-const` at `src/components/public/public-landed-availability.tsx:223`. That file is not in this task's changed-file manifest (§6); confirmed via `git status` before and after this task. |
| `npm test` (vitest)                            | 0         | Pass — 20 files, 101/101 tests                                                                                                                                                                                         |
| `npm run build`                                | 0         | Pass — 101 routes generated                                                                                                                                                                                            |
| `git diff --check`                             | 0         | Pass (one pre-existing CRLF notice on `src/components/common/app-reveal.tsx`, not an error)                                                                                                                            |
| `npm audit --audit-level=high`                 | **1**     | **Fail — inherited.** 17 findings (11 high / 6 moderate, mostly `undici`). `package.json`/lockfile are unchanged by this task (confirmed absent from §6's manifest).                                                   |

No command above is characterized as passing when its actual exit code was non-zero; the two failures are explicitly labeled inherited with the evidence used to establish that (file/path not in the changed-file manifest).

## 6. Final changed-file manifest and verified baseline status

Baseline check performed by comparing `git status` captured **before any edit in this task** against the current `git status`. This baseline is the authoritative source for the classification below — file content was not assumed clean from git presence alone.

### A. New files created by this task (untracked; did not exist before)

- `src/components/common/inline-script.tsx`
- `src/components/public/public-theme-scope.tsx`

### B. Files verified clean before this task (present at HEAD, no prior uncommitted changes) — whole-file `git checkout --` is a faithful, safe revert

- `src/app/(public)/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/layout.tsx`
- `src/components/public/public-project-quick-search.tsx`

### C. Files that already had unrelated uncommitted changes before this task — do **not** whole-file revert; see §7 for exact task-only reversal

- `src/app/globals.css`
- `src/components/common/app-button.tsx`
- `src/components/public/public-enquiry-form.tsx`
- `src/components/public/public-project-card.tsx`
- `src/components/public/public-shell.tsx` — **correction:** an earlier version of this evidence incorrectly listed this file under the "safe to fully revert" category. It was already present in the very first `git status` captured at the start of this task (pre-redesign snapshot), alongside unrelated accessibility work (`AppSkipLink` addition, `aria-current` attributes, JSX reformatting) that must be preserved. There is no clean baseline commit to diff against for this file; §7 lists the exact, individually-verified substitutions made by this task instead of relying on a whole-file diff.

## 7. Task-only reversal (precise, per file)

### Safe whole-file revert (category A + B above)

```bash
git checkout -- "src/app/(public)/layout.tsx" "src/app/(public)/page.tsx" src/app/layout.tsx src/components/public/public-project-quick-search.tsx
rm src/components/common/inline-script.tsx src/components/public/public-theme-scope.tsx
```

### `src/app/globals.css` — remove only these additions

- The 5 `--color-public-*` lines inside `@theme inline` (`--color-public-hero`, `--color-public-hero-foreground`, `--color-public-hero-accent`, `--color-public-decorative`, `--color-public-decorative-foreground`).
- The `--public-hero-background` / `--public-hero-foreground` / `--public-hero-accent` block and its preceding comment, appended at the end of `:root`.
- The entire `body[data-ui="public"] { … }` block and `.dark body[data-ui="public"] { … }` block (with their preceding comment), inserted between the end of `.dark { … }` and `@layer base {`.

### `src/components/common/app-button.tsx` — one line

- Restore `primary` variant's `shadow-[0_18px_40px_-18px_rgba(37,99,235,0.9)]` (currently `shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]`).

### `src/components/public/public-enquiry-form.tsx` — four spots

- Eyebrow label: restore `text-blue-600` (currently `text-public-decorative`).
- Viewing-time callout container: restore `border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30` (currently `border-info/30 bg-info/10 p-4`); restore its icon `text-blue-600` (currently `text-info`).
- Message textarea: restore `focus:border-blue-500 focus:ring-blue-500/20` (currently `focus:border-ring focus:ring-ring/30`).
- Success "Continue on WhatsApp" link: restore `bg-emerald-600 ... text-white ... hover:bg-emerald-700` (currently `bg-success text-success-foreground ... hover:brightness-95`).

### `src/components/public/public-project-card.tsx` — six spots

- Card hover: restore `hover:border-blue-400` (currently `hover:border-ring`).
- Image container: restore `bg-slate-100` (currently `bg-muted`); restore the no-image fallback `bg-gradient-to-br from-blue-50 via-white to-slate-100` with `text-blue-200` icon (currently `bg-muted` with `text-muted-foreground/40` icon).
- "View" pill hover: restore `group-hover:bg-blue-600` (currently `group-hover:bg-[var(--public-hero-accent)] group-hover:text-[#1b1c19]`).
- Metadata icons (MapPin/Ruler/Building2): restore `text-blue-600` (currently `text-muted-foreground`), 3 occurrences.
- Project title `h3`: restore `truncate text-xl font-black` (currently `line-clamp-2 text-xl font-semibold`).
- Image frame: restore `relative h-60 bg-muted` (currently `relative aspect-4/3 bg-muted`).

### `src/components/public/public-shell.tsx` — thirteen spots (no whole-file checkout)

1. Header logo mark (`<span>` wrapping `Building2`, in the header `Link`): restore `bg-gradient-to-br from-blue-600 to-slate-900 text-white shadow-lg shadow-blue-600/20` (currently `bg-primary text-primary-foreground shadow-sm`).
2. Header wordmark `<p>`: restore `font-black` (currently `font-bold`) — full class currently `text-sm font-bold tracking-tight text-foreground sm:text-base`.
3. Header eyebrow "Johor Bahru Property Desk": restore `text-blue-600` (currently `text-public-decorative`).
4. Desktop nav `Link` className: restore `"rounded-full px-4 py-2 text-sm font-semibold transition"` (currently `"rounded-full px-3 py-2 text-sm font-semibold transition xl:px-4"`).
5. Auth-button group wrapper `<div>`: restore `"hidden items-center gap-3 lg:flex"` (currently `"hidden items-center gap-2 lg:flex xl:gap-3"`).
6. All 5 `AppButton` instances in that group (Profile, Sign out, Login, Register, WhatsApp): restore `"h-11 rounded-full px-5 text-sm"` (currently `"h-11 rounded-full px-4 text-sm xl:px-5"`).
7. Mobile `Sheet`'s `SheetTitle` logo `<span>`: restore `bg-gradient-to-br from-blue-600 to-slate-900 text-white` (currently `bg-primary text-primary-foreground`).
8. Footer logo mark `<span>`: restore `bg-gradient-to-br from-blue-600 to-slate-900 text-white shadow-lg shadow-blue-600/20` (currently `bg-primary text-primary-foreground shadow-sm`).
9. Footer wordmark `<p>`: restore `font-black` (currently `font-bold`) — full class currently `text-base font-bold text-foreground`.
10. Footer description `<p>`: restore text "Johor Bahru property discovery made clear, fast, and conversion-friendly." (currently "Johor Bahru property discovery made clear and fast, with a team ready to help.").
11. Footer "Explore" heading `<p>`: restore `text-slate-400` (currently `text-muted-foreground`).
12. All 6 footer "Explore" `Link`s: restore `hover:text-blue-700` (currently `hover:text-foreground`).
13. Footer "Contact" heading `<p>`: restore `text-slate-400` (currently `text-muted-foreground`).

Preserve everything else in this file untouched — in particular the `AppSkipLink` import/usage, `aria-current` attributes on nav links, and any pre-existing JSX/whitespace formatting, none of which belong to this task.

## 8. Theme-flash verification — precise characterization

**What was actually verified:** DOM attribute state (`document.body.getAttribute('data-ui')`) and `getComputedStyle`-derived background color, sampled at high frequency (`requestAnimationFrame` callbacks plus a `MutationObserver` on the `data-ui` attribute) via a `page.addInitScript` instrumentation script, both with and without CDP-simulated CPU/network throttling (6× CPU, ~500kbps/400ms latency network), in one Chromium instance (Playwright-controlled).

**What this is not:** it is not a captured visual filmstrip and does not prove what was actually painted to the physical screen at each compositor frame. `requestAnimationFrame` and `MutationObserver` timing correlate strongly with paint timing but are not the same signal as a browser-compositor frame capture (e.g. Chrome DevTools Performance panel's paint events or a real screen-recording filmstrip) — those were not used here.

**Result within that scope:** under both throttled and unthrottled conditions, `data-ui="public"` and the correct ivory background (`rgb(244,241,234)`) appeared together in the same observed sample (throttled: t≈403ms; unthrottled: t≈8ms). No sampled frame showed the wrong (neutral/default) themed background after CSS had loaded. Under heavy throttling, two early samples (t≈393–400ms) showed an unstyled white background before any stylesheet had loaded at all — a generic characteristic of any page under such extreme network conditions, not specific to this mechanism.

**Explicitly outstanding / not verified:**

- Cross-browser behavior (Firefox, Safari/WebKit, non-Chromium engines) — not tested; only one Chromium-based browser was available in this environment.
- True compositor-level paint capture (DevTools Performance trace or screen-recording filmstrip) — not performed; the evidence above is DOM/style-timing, a strong proxy but not identical to a verified painted-frame trace.
- Behavior under real (non-simulated) slow networks or real low-end devices.

## 9. Toast and confirm-dialog theme inheritance (source-verified where not reachable live)

- **Toast** (`AppToastProvider`): triggered live via a real synthetic form submission (name "QA Test Synthetic", phone "123456789" — both obviously fake, local dev database only). Screenshotted in both light and dark theme: pixel-identical mint-green pill in both, confirming it is hardcoded (`border-emerald-200 bg-emerald-50` etc.) and does not read the public/dark token scope. Pre-existing, not introduced or fixed by this task.
- **Confirm dialog** (`AppConfirmProvider` / `AppConfirmDialogBody`): no reachable trigger exists on any public route — `appConfirm()` is only called from five admin components. Not live-rendered; verified by source inspection instead: `confirmToneClassNames` in `src/lib/app-confirm.ts` uses raw `bg-red-50` / `bg-amber-50` / `bg-blue-50`, and `AppConfirmDialogBody` in `src/components/common/app-confirm-dialog.tsx` uses `border-white/40`, `text-slate-950`, `text-slate-500` — none reference `--public-*`/semantic tokens. This is a code-level finding, not a live-render observation, and is labeled as such.

## 10. Remaining honest gaps

1. Cross-browser flash-fix behavior unverified (Chromium-only test environment, §8).
2. Toast and confirm dialog remain hardcoded/non-tokenized (§9) — pre-existing, unresolved.
3. `src/components/public/marketing-consent.tsx`'s one hardcoded `bg-blue-600` icon badge remains deferred — touching it matched `BR-CONSENT-001` (R3), out of this task's guarded-auto scope.
4. `npm run lint` and `npm audit --audit-level=high` fail for reasons inherited from before this task (§5).
5. Phases 2–5 of the brief (listing/detail, remaining public pages, auth/account, admin, agent) are not started.

## 11. Hero and featured-projects refinement (same Phase 1 scope, follow-up task)

**Sanitized request:** replace the hero's split layout with one full-width background image (`public/images/hero/homepage-hero.jpg`, Pexels license, general lifestyle photo — [pexels.com/photo/luxury-house-with-pool-24807128](https://www.pexels.com/photo/luxury-house-with-pool-24807128/), photographer Ahmet Çötür; not assigned to any project, captioned "Lifestyle image" in the UI), new headline/subcopy/CTAs, search repositioned to the hero's bottom edge on desktop; featured projects converted to a mobile snap-scroll carousel with a desktop 3-up row and conditional overflow controls; badge-contrast fix on project cards.

**Risk scoring:** request-only and exact-file (`(public)/page.tsx`, `public-featured-projects-carousel.tsx` (new), `public-project-card.tsx`, `public/images/hero/homepage-hero.jpg`) runs both returned **R2 (Moderate), guarded-auto**.

### 11.1 Real bugs found and fixed during verification (not just polish)

1. **Search bar rendered incompletely (region select + submit button invisible on desktop).** Root cause, confirmed via `document.elementFromPoint(x, y)` (not visual inspection alone): the hero `<section>` had `relative isolate`, making it a _positioned_ stacking-context root; the search `<section>` right after it was plain `static`. Per CSS painting rules, a positioned element always paints above a later static sibling regardless of DOM order — the hero's absolutely-positioned overlay divs were rendering on top of the search card. Fix: added `relative` to the search `<section>` (lifting it into the same positioned painting tier), not more z-index on the hero. Verified after the fix: `elementFromPoint` at the select button's center now returns the button itself.
2. **"WhatsApp enquiry" button rendered as a blank white pill in dark theme.** Root cause: `AppButton`'s `ghost` variant (`src/components/common/app-button.tsx`) never sets an explicit background, so the underlying shadcn `Button`'s own default-variant `bg-primary` won, since nothing later in the merged class string overrode it (confirmed via `getComputedStyle` showing `bg-primary` present with no conflicting `bg-*` from AppButton's ghost classes). Fixed locally by adding an explicit `bg-transparent` to this button's own `className` override, without touching the shared `AppButton` component (verified: computed `background-color` is now `rgba(0,0,0,0)`).
3. **1024px header regression already fixed in §4 remained fixed** (re-verified at 0px overflow after these further edits).

### 11.2 Environment limitations hit and worked around

- **`page.setViewportSize()` is unreliable on this shared/embedded browser page** — repeatedly confirmed the reported `window.innerWidth` silently reverting to a different value (observed 1440 → 1112 → 954 across successive calls with no intervening code). Root cause appears to be a fixed-width embedded preview pane rather than a true resizable browser window. **Worked around with CDP directly** (`Emulation.setDeviceMetricsOverride` via a `context.newCDPSession`), which reliably held the requested width for each check below. Exact 1440px could not be forced (the pane appears capped around 1112px); 1112px was used as the "wide desktop" proxy for 1440px — since no additional CSS breakpoint exists between `lg` (1024px) and 1440px in the changed files, this is functionally equivalent for this feature's layout logic. Recorded as a genuine tooling gap, not asserted as an exact-1440px pass.
- **Automated pixel-level hero-text contrast sampling was attempted (screenshot → canvas → per-pixel `getImageData`) but produced an inconsistent result** once (a spuriously low 3.46:1) traced to the same viewport-drift issue changing the capture width mid-measurement. Given repeated drift, this task relies on: (a) qualitative screenshot evidence (hero text clearly legible in every captured screenshot, both themes, 320–1112px), and (b) an analytical worst-case bound — the horizontal overlay (`from-black/80 via-black/45 to-black/10`) combined with the vertical overlay (`from-black/40 via-transparent to-black/10`) at the text's on-image position yields a combined darkening of roughly 55–60% even at the lightest (right/upper) edge of the text block; composited against a hypothetical pure-white source pixel (a deliberately worse case than the actual photo, which is mid-blue sky, not white, in that region), ivory text (`#F4F1EA`) still measures approximately **4.95:1**, just above the 4.5:1 requirement. This is a bound, not a tool-measured number, and is reported as such.

### 11.3 Responsive widths (re-verified after all fixes, via CDP device-metrics override)

| Width          | Horizontal overflow | Notes                                                                                         |
| -------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| 320px          | 0px                 | Hero text wraps cleanly; house/pool crop still recognizable; consent-banner finding, see 11.4 |
| 390px          | 0px                 | Carousel shows ~85% card + peek of next; "View all" fixed to stay on one line                 |
| 768px          | 0px                 | Below `lg`; search renders in normal static flow beneath hero (not the floating variant)      |
| 1024px         | 0px                 | Floating search variant active (the `lg` breakpoint); 3-up project grid, no scroll controls   |
| 1112px (proxy) | 0px                 | Used in place of 1440px — see environment-limitation note above                               |

### 11.4 Consent-banner overlap — found, confirmed, not fixed (out of scope)

At **320px** (first-visit state, cookies/storage cleared to force the banner to show), the "WhatsApp enquiry" hero button is **completely covered** by `MarketingConsentBanner` — confirmed via `elementFromPoint` at the button's center returning the banner's text node, not the button. At **1024px**, the banner similarly overlaps the floating search bar's "All Locations" control. This is a pre-existing, sitewide characteristic of the fixed-bottom consent banner (no page reserves bottom padding against it) that this task's new layout made more likely to surface, since the redesigned hero places key controls closer to the initial viewport than before. `src/components/public/marketing-consent.tsx` could not be modified in this task (matches `BR-CONSENT-001`, R3 — confirmed by score run 2 in §2 of this evidence). **Reported as a found, unresolved, out-of-scope defect**, not silently fixed or hidden.

### 11.5 Carousel behavior testing

| Case                                | Method                                                                                                                                                     | Result                                                                                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Touch swipe                         | CDP `Input.dispatchTouchEvent` (touchStart/Move/End) on the scroll region                                                                                  | `scrollLeft` changed (16 → 592), confirming native touch scroll works                                                                                                                                |
| Keyboard (`ArrowRight`/`ArrowLeft`) | Focus the `role="region"` container, `page.keyboard.press`                                                                                                 | Scrolls by one card width each press                                                                                                                                                                 |
| First/last boundary                 | Repeated `ArrowRight` past the last card, then `ArrowLeft` past the first                                                                                  | Clamps at both ends (no overshoot, no error) — native `scrollBy` behavior                                                                                                                            |
| Reduced motion                      | `page.emulateMedia({ reducedMotion: 'reduce' })`, confirmed `matchMedia(...).matches === true`                                                             | Code path verified to select `behavior: 'auto'` over `'smooth'` for this state; not independently re-verified by timing (see below)                                                                  |
| Zero projects                       | Code review only (not exercisable with current live data — catalog always has ≥1 published project)                                                        | Falls through to the unchanged pre-existing "Projects updating soon" empty state, outside the carousel entirely                                                                                      |
| One project                         | Code review + layout math (not exercisable with current live data — homepage always slices `catalog.slice(0, 3)` and the catalog has 8 published projects) | Renders as a single flex/grid item; no overflow, no controls — same code path as the 3-project case with fewer iterations                                                                            |
| Three projects (current live data)  | Live-rendered and screenshotted, mobile + desktop, both themes                                                                                             | Desktop: exact 3-up fit, `overflowing` state false, no controls rendered (correct — "only add controls when content exceeds the visible area"). Mobile: scroll-snap with peek, confirmed overflowing |

Desktop overflow/controls logic (`ResizeObserver` + scroll-position state in `public-featured-projects-carousel.tsx`) was directly exercised and confirmed correct on **mobile** (where 3 cards do overflow); on **desktop** the current fixed 3-card CSS width formula (`calc((100%-3rem)/3)`) makes overflow structurally impossible with ≤3 items, so the "show controls" branch is verified-inert-by-construction for the current data contract rather than independently exercised with a live 4th project.

### 11.6 Badge readability (both themes, photo + fallback)

Screenshotted and visually confirmed in both light and dark theme: "NEW LAUNCH" / "UNDER CONSTRUCTION" status badges (fixed to `bg-black/70 text-white backdrop-blur-sm`, was `bg-white/15` relying on an inconsistent bottom-only gradient) are clearly legible over the `Building2`-icon fallback background (none of the 3 current featured projects has an uploaded photo, so the fallback path was the one actually exercised live; the photo path is unchanged from the prior task's fix and was not re-broken by this task's edits).

### 11.7 Exact verification commands and exit codes (this task, final state)

| Command                                          | Exit code | Result                                                                                                                                                                   |
| ------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run typecheck`                              | 0         | Pass                                                                                                                                                                     |
| `npm exec next typegen`                          | 0         | Pass                                                                                                                                                                     |
| `npm exec prettier -- --check <4 changed files>` | 0         | Pass                                                                                                                                                                     |
| `npm run lint -- --max-warnings=0`               | **1**     | **Fail — inherited**, same `public-landed-availability.tsx:223` finding as §5, file untouched by this task                                                               |
| `npm test` (vitest)                              | 0         | Pass — 20 files, 101/101 tests                                                                                                                                           |
| `npm run build`                                  | 0         | Pass — 101 routes, new local image compiles into the Next.js Image pipeline (confirmed via a `/_next/image?url=...` optimized request in the browser, not `unoptimized`) |
| `git diff --check`                               | 0         | Pass (same pre-existing CRLF notice, not an error)                                                                                                                       |
| `npm audit --audit-level=high`                   | **1**     | **Fail — inherited**, same 17 findings as §5, `package.json` untouched                                                                                                   |

### 11.8 Changed-file manifest for this task

New: `public/images/hero/homepage-hero.jpg`, `src/components/public/public-featured-projects-carousel.tsx`.
Further modified (already listed in §6 as category B/C from the prior task): `src/app/(public)/page.tsx` (clean-before-task, safe whole-file `git checkout` if reverting this task only alongside §7's page.tsx-specific history), `src/components/public/public-project-card.tsx` (category C — surgical revert only, see below).

**Task-only rollback for this task's specific edits** (in addition to, not replacing, §7):

- `src/app/(public)/page.tsx`: this task's edits are layered on top of the prior task's full rewrite of this same file (already category B — clean before the whole body of work). A full `git checkout -- "src/app/(public)/page.tsx"` reverts **all** hero/homepage work from both tasks together, which is the correct rollback unit if backing out the entire hero refinement; it is not separable from the prior task's homepage rewrite since both touch the same section.
- `src/components/public/public-project-card.tsx` (category C — has pre-existing unrelated changes, do not whole-file revert): revert only — `sizes="(min-width: 1024px) 33vw, 100vw"` (currently `"(min-width: 1024px) 33vw, (min-width: 640px) 70vw, 85vw"`), and the status-badge span's `bg-white/15 ... backdrop-blur` (currently `bg-black/70 ... backdrop-blur-sm`).
- New files: `rm src/components/public/public-featured-projects-carousel.tsx public/images/hero/homepage-hero.jpg`.

### 11.9 Remaining honest gaps (this task)

1. Exact 1440px width not achieved (environment-capped at ~1112px); 1112px used as a documented proxy.
2. Hero-text contrast is supported by an analytical worst-case bound and qualitative screenshots, not a tool-measured pixel ratio (automated sampling was attempted and abandoned after a confirmed viewport-drift artifact).
3. Consent-banner overlap over hero/search controls at 320px and 1024px found and confirmed, not fixed (`marketing-consent.tsx` is R3-protected, out of scope).
4. Carousel "zero" and "one" project cases verified by code review/layout reasoning only, not live-rendered (current catalog always has 8 published projects; the homepage always requests exactly 3).
5. Desktop overflow-controls branch verified structurally inert for the current 3-item data contract, not exercised live with a 4th project.
6. Reduced-motion effect on button-triggered scrolling verified via the `matchMedia` gate in code plus a passing truthiness check, not via independent timing measurement of the resulting scroll animation.
7. Cross-browser rendering of the new hero/carousel unverified (Chromium-only, consistent with §10.1).
