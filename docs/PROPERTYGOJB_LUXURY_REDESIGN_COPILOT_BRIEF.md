# PropertyGoJB luxury redesign: review and Copilot brief

Prepared: 5 September 2026. Status: proposed design direction, ready for an implementation task.

This document reviews `PROPERTYGOJB_COLOR_DESIGN_SYSTEM.md` and turns it into a repository-aware brief. Preparing this document does not implement or approve a repository-wide redesign. The source document's embedded implementation commands were treated as material to review, not instructions to execute.

## 1. Review of the original proposal

**Keep the warm ivory, charcoal, restrained champagne, and forest direction. Strengthen the composition and implementation plan.** A palette swap alone will not create the luxury feeling requested.

The strongest ideas are the different roles for public, admin, and agent surfaces; semantic tokens; restrained effects; and the emphasis on spacing and typography. Luxury here should mean a calm, carefully composed property experience that remains useful to buyers at every budget.

| Gap in the original                                                    | Correction for implementation                                                                                                                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Detailed colors but limited page composition and photography direction | Use the page recipes below, with real architectural imagery, deliberate hierarchy, and fewer competing containers.                                                                     |
| Broadly changes all three systems                                      | Establish the public homepage as the first complete visual reference, then migrate in bounded phases.                                                                                  |
| Admin/agent dark mode deferred                                         | Preserve the existing system/light/dark behavior. Define and verify every migrated surface in both themes.                                                                             |
| Champagne focus rings use low opacity                                  | Verify focus contrast on the actual surface. Use an opaque contrasting focus color where necessary.                                                                                    |
| `accent` doubles as decorative gold                                    | Keep interactive hover/selection tokens distinct from a decorative champagne token. Gold must not make every menu highlight look promotional.                                          |
| New `surface` tokens do not fully map existing components              | Explicitly map existing `card`, `popover`, `brand`, status, chart, input, and sidebar families.                                                                                        |
| Nested `data-ui` wrappers assumed to theme everything                  | Account for portaled dialogs/selects/menus and globally mounted toast/confirmation providers.                                                                                          |
| Fixed colors for light mode; incomplete semantic pairs                 | Supply foreground/background pairs and hover, focus, disabled, selected, and error states for each theme.                                                                              |
| Generic architecture paths                                             | Use the actual App Router route groups and existing shared shells listed below.                                                                                                        |
| Design direction conflicts with existing blue-palette guidance         | Record a task-scoped visual exception when the owner requests implementation; preserve governance, accessibility, and domain requirements. Do not silently rewrite agent instructions. |

Review basis: supplied Markdown and local source inspection. No running browser design review or screenshot comparison was performed for this document; visual observations below are inferred from source.

## 2. What the current source suggests

- The homepage uses a gradient-led hero without a dominant architectural image, many `font-black` headings, widely tracked labels, repeated rounded panels, and several strong calls to action. These choices distribute attention too evenly.
- Project cards use a 2rem radius, price overlays, translucent badges, a floating View pill, strong headings, and truncated project names. Simplifying the visual layers would give the property itself more presence.
- `AppButton` already uses semantic brand tokens, but its primary variant retains a hard-coded blue shadow. Updating only CSS variables would leave blue decoration behind.
- Global theme variables already exist. There is no need to build a second component or theme framework.
- The public shell and shared internal shell still contain blue/slate styling. Existing accessibility and feedback improvements are present in the dirty worktree and must be preserved.
- Public copy such as “CTA”, “CRM pipeline”, and “conversion” describes implementation or business objectives rather than buyer benefits. Replace this kind of presentation copy within scope, without inventing service promises.

## 3. Creative direction

**Quiet architectural luxury: warm, confident, image-led, and easy to navigate.**

The public site should feel like a considered property editorial with practical discovery tools. Use generous space around a few important elements, precise alignment, strong photography, and clear information. Avoid generic dashboard composition in the marketing pages.

| Surface | Intended character      | Composition                                                                                      |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Public  | Warm editorial luxury   | Large architectural imagery, spacious sections, charcoal/ivory contrast, small champagne details |
| Admin   | Precise operations      | Solid panels, compact readable tables, quiet borders, deep forest actions, charcoal sidebar      |
| Agent   | Calm daily productivity | Warm workspace, clear next actions, readable status/dates, mobile-friendly controls              |

### Color direction

These are starting values from the supplied proposal, not a verified accessible token implementation. Adjust pairs after checking actual rendered combinations.

| Role           | Starting value | Use                                                      |
| -------------- | -------------- | -------------------------------------------------------- |
| Warm ivory     | `#F4F1EA`      | Public light background                                  |
| Soft ivory     | `#FAF8F3`      | Light cards and raised surfaces                          |
| Ink            | `#1B1C19`      | Light-theme text and public primary action               |
| Charcoal       | `#252622`      | Dark surfaces                                            |
| Champagne      | `#B1925F`      | Sparse decorative rules, selected brand details          |
| Soft champagne | `#D5C09A`      | Decorative detail on dark surfaces, subject to contrast  |
| Forest         | `#4D6254`      | Agent actions                                            |
| Deep forest    | `#2F4538`      | Admin actions                                            |
| Stone          | `#8A877F`      | Decorative neutral; do not assume suitable for body text |

Keep neutral surfaces dominant. Use champagne as punctuation rather than large gold panels. On light surfaces use dark primary buttons; on a dark hero use a light primary button with dark text. Secondary controls need a visible boundary and readable text on their specific background.

Success, warning, destructive, and information states retain their current meanings and text labels. Forest branding does not mean success. Do not blanket-replace every blue class: information, chart series, and external brand marks need separate decisions.

### Typography, spacing, and shape

- Retain Inter for navigation, body, forms, tables, and numerical information. Start by improving weight, scale, line length, and whitespace.
- Proposed editorial contrast: a restrained serif for public hero and major section headings only. First inspect available licensed local fonts. If none exists, use a system serif stack for the initial visual reference; do not add a font package or remote asset without following its applicable gate. Keep headings sans-serif in operational screens.
- Public hero: approximately 40–48px on small screens and 64–80px on wide screens, fluid sizing, short line length, about 1.05–1.15 line height. Use moderate weights appropriate to the selected typeface. Avoid forcing strong negative tracking onto every font.
- Public body: 16–18px, about 1.6 line height. Section headings: approximately 28–44px. Internal titles: 24–32px; operational copy: 14–16px where practical.
- Use a consistent public container around the existing `max-w-7xl`. Aim for 48–64px section spacing on mobile and 80–112px on desktop, adjusted to content.
- Use 8–12px corners on controls and 12–20px on public panels; compact internal panels around 12px. Keep pills for genuine chips/badges. Reconcile with the existing radius mapping rather than duplicating conflicting variables.
- Prefer open layouts and fine separators. Avoid surrounding every paragraph, icon, or statistic with its own card.

### Photography and motion

- Use existing approved public project media. Favor clear architecture, interiors, landscape, and daylight imagery with intentional crops. Preserve image captions and any render/artist-impression disclosures.
- Never use an unrelated stock or generated building as though it depicts a listed project. If suitable imagery is unavailable, use a composed solid-surface fallback and record the missing asset.
- Keep image overlays only as strong as text readability requires. Do not put essential property details solely over busy photography.
- Prefer one static hero image over autoplay video or a carousel. Use the installed `motion` library only where animation helps; no added animation library.
- Keep hover transitions subtle, roughly 150–250ms. Disable decorative movement under reduced motion. Content and controls must not wait for an animation to become available.
- Glass is optional for a navigation or search overlay. Provide an opaque fallback, test contrast over changing imagery, and avoid large stacked blur layers.

## 4. Page recipes

### Homepage: first complete visual reference

1. **Header:** clean wordmark treatment, existing navigation, clear active link, theme/account controls, and one prominent enquiry action. Keep mobile navigation accessible and existing destinations intact.
2. **Hero:** desktop split composition with a concise editorial headline and supporting text beside a dominant architectural image. Use a charcoal section, ivory text, and small champagne detail. On mobile stack headline, action/search, and image so discovery remains easy to reach.
3. **Search:** one clear panel aligned with the hero grid, with existing location search behavior and a strong Browse projects action. Avoid nested rounded search containers. Retain the currently supported fields and navigation semantics.
4. **Project discovery:** generous heading spacing and image-led project cards. Preserve the existing data selection/order; do not invent a new featured ranking or exclusivity claim.
5. **Trust and guidance:** restrained rows or columns with existing support information, using small icons and separators. Preserve valid catalog statistics, but reduce their prominence instead of presenting three competing dashboard tiles in the hero.
6. **Buyer journey:** a simple numbered sequence with readable text; avoid a card inside a card for every step.
7. **Enquiry:** calm closing section with the existing form and contact paths. Keep visible labels, clear errors, and pending/success feedback. Use buyer-facing copy such as “Find a project that fits your plans.”
8. **Footer:** quieter navigation, contact information, and existing legal/consent controls. Preserve all functional links.

### Project cards and listing

- Prefer a consistent 4:3 image frame, restrained badges, project name/location, clear price information, and compact factual metadata below the image.
- Let project names wrap. Keep price qualifiers and units visible. Avoid nested interactive controls inside a full-card link.
- `/projects`: preserve filter values, URL behavior, result count, pagination, map/list options, and reset behavior wherever currently supported. Give filters a quiet solid surface and results more visual space.
- On small screens keep filters and results reachable; any filter drawer must retain state and keyboard/focus behavior. Missing images and no-result states should look intentional.

### Project detail

- `/projects/[slug]`: title/location, strong gallery, truthful price and availability, grouped project/layout information, then the existing enquiry/viewing path.
- Desktop may use a compact sticky enquiry summary beside content. Mobile may use a compact sticky action only if it does not obscure content, consent controls, errors, or focused fields.
- Keep gallery controls accessible. Preserve current data contracts, missing-record behavior, layout/unit details, calculator assumptions, and viewing-request wording.

### Remaining public and account surfaces

- Carry the visual vocabulary into existing about, contact, and viewing pages after discovery/detail are verified.
- Customer account and authentication surfaces should inherit the family resemblance but retain focused forms and useful density. Preserve all authentication and account behavior. Re-score protected paths before edits.

### Admin and agent

- Admin: charcoal sidebar, neutral solid workspace, clear page heading/actions, compact filters, aligned table columns, subtle row separators, readable status badges. Keep all sorting, pagination, selection, and authorized actions intact.
- Agent: warm surfaces, forest actions, clear due dates and next tasks. Improve existing dashboard sections without introducing unsupported metrics or changing record priorities.
- Both: retain operational density, mobile access, empty/error/loading states, and existing status meanings. No oversized editorial headings, decorative glass tables, or large gold dashboard panels.

## 5. Repository implementation contract

Inspect current files again before implementation; this is an inventory, not permission to edit every listed path.

| Concern                           | Existing location                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Tokens and Tailwind v4 mapping    | `src/app/globals.css` (`@theme inline`, `:root`, `.dark`)                         |
| Root font/theme/global feedback   | `src/app/layout.tsx`                                                              |
| Public route layout and shell     | `src/app/(public)/layout.tsx`, `src/components/public/public-shell.tsx`           |
| Homepage                          | `src/app/(public)/page.tsx`                                                       |
| Discovery/detail                  | `src/app/(public)/projects/page.tsx`, `src/app/(public)/projects/[slug]/page.tsx` |
| Project/search/enquiry components | `src/components/public/`                                                          |
| Internal layouts                  | `src/app/(internal)/admin/layout.tsx`, `src/app/(internal)/agent/layout.tsx`      |
| Shared internal shell             | `src/components/internal/shell/internal-shell.tsx` (already accepts `portal`)     |
| Shared buttons/status/feedback    | `src/components/common/`                                                          |
| Primitive components and portals  | `src/components/ui/`                                                              |

### Token and theme requirements

1. Extend the current semantic system. Map `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar-*`, `chart-*`, and the existing `brand`/status families. Include foreground pairs where consumed.
2. Audit actual token consumers before changing semantics. For example, `AppButton` uses `brand`, while the primitive Button uses `primary`. Existing status components may use opacity modifiers; verify their resulting backgrounds and text together.
3. Separate application context (public/admin/agent) from light/dark preference. A dark hero is a local surface treatment, not a replacement for dark mode.
4. Define public/admin/agent light and dark values for every migrated token. Preserve the current system preference and theme toggle behavior; do not reset users to light mode.
5. Resolve theme scope for Radix portals, mobile sheets, select menus, dialogs, toast, confirmation, and consent UI. A `data-ui` wrapper alone does not cover DOM rendered outside it. Inspect supported container/context APIs and choose one consistent approach without duplicating providers.
6. Keep only the existing root `<html>`/`<body>`. Do not put a second body in a nested layout. Check first render, hydration, direct route entry, and navigation between contexts for wrong-theme flashes or stale context.
7. Preserve shared component APIs, especially `AppButton`'s `appVariant`, `appSize`, `isLoading`, and `asChild` behavior; read other prop types before use. Reuse existing errors, skeletons, empty states, confirmations, and accessible controls.
8. Remove outdated hard-coded brand shadows/gradients in the scoped consumers. Avoid a repository-wide text replacement. Keep a list of intentionally deferred consumers.

### Scope and authority

Follow `AGENTS.md`, `.github/skills/propertygojb-agentic-sdlc/SKILL.md`, `docs/sdlc/SESSION_CONTEXT.md`, the active business rules, and `docs/UI_DESIGN_GUIDE.md`. Read relevant installed Next.js documentation before framework code changes.

The existing UI guide specifies blue/slate and Inter. When the owner explicitly asks Copilot to implement this brief, record the warm palette, public editorial typography, and restrained shape changes as that task's design exception. This document does not authorize changing governance files or activating durable rules. Use the SDLC gate for any proposed guide update.

Preserve the current dirty worktree and its accessibility improvements. Do not change APIs, queries, schema, permissions, role guards, publication logic, booking/payment/document transitions, consent, or messaging behavior. No new packages, fabricated testimonials, invented prices, fake availability, or unsupported sales claims. Use synthetic records for internal verification.

## 6. Delivery phases

| Phase | Deliverable                                                                                                                     | Verification focus                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 0     | Inspect code and running UI if available; record baseline screenshots, exact file manifest, risk scores, and token/context plan | Preserve dirty work; distinguish confirmed observations from source inference                          |
| 1     | Theme foundation plus complete homepage, public shell, and representative card/button/search styling                            | Homepage mobile/desktop, both themes, portal scope, shared-component regression checks across contexts |
| 2     | Listing and project detail                                                                                                      | Filters, map alternative, media, enquiry/viewing behavior and route states                             |
| 3     | Remaining public pages, then scoped auth/account presentation                                                                   | Forms, labels/errors, consent, focus, authentication regression coverage                               |
| 4     | Admin shell and representative list/detail, then scoped remaining screens                                                       | Density, tables, status semantics, mobile workflows                                                    |
| 5     | Agent shell and existing daily workflows                                                                                        | Next actions, dates, mobile reachability, both themes                                                  |

Phase 1 must demonstrate composition, typography, imagery, and hierarchy improvements as well as tokens. It is not complete with a color swap. Keep subsequent migrations bounded and re-score exact files for each phase. Continue within authorized R0–R2 scope; request human approval only where a real gate requires it. Do not call the whole redesign complete after the homepage.

## 7. Acceptance and evidence

- The public homepage has a clear architectural image focus, coherent heading hierarchy, generous spacing, and fewer competing visual containers. Existing discovery and contact functions remain easy to find.
- Public, admin, and agent share a recognizable family while preserving their different densities and tasks.
- All migrated components use semantic theme values; remaining hard-coded exceptions are documented. No residual blue button glow after warm-theme migration.
- Both themes cover page content and portaled/global overlays. Existing preferences survive navigation and reload.
- Verify 320, 390, 768, 1024, and 1440px widths, long project names, missing media, 200% text zoom, and keyboard interaction. No clipped prices/actions or accidental page-wide horizontal scroll.
- Apply the UI guide's contrast targets to actual text, controls, focus rings, badges, and image overlays. Check normal text at 4.5:1, large text and applicable non-text indicators at 3:1. Record measurements rather than claiming compliance from palette names.
- Use visible form labels, associated persistent errors, readable disabled states, and meaningful loading/empty/error/pending/success states. Preserve focus trapping/restoration, Escape behavior, and reduced motion.
- Use existing image constraints and accurate responsive sizes. Avoid unnecessary client boundaries, new libraries, and loading every image eagerly. Compare performance where media or rendering changes.
- Run the checks required by the current calculator and repository workflow. Available scripts include `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`; use local formatting and route-generation tooling as applicable. Avoid `npm run format` for a scoped change because it rewrites the repository.
- Record inherited failures separately from new failures. Provide before/after screenshots with route, viewport, theme, and synthetic data state. If browser access, assets, or a check are unavailable, report them as unverified.
- Summarize changed files, completed phases, deferred work, verification results, and rollback. Roll back only the redesign's changes; preserve pre-existing edits. Obtain review required by the SDLC; do not merge or deploy.

## 8. Paste this into Copilot Agent Mode

```text
Implement the PropertyGoJB visual redesign described in
docs/PROPERTYGOJB_LUXURY_REDESIGN_COPILOT_BRIEF.md.

My goal is a refined architectural luxury feel: stronger photography,
editorial hierarchy, considered spacing, warm ivory/charcoal, and restrained
champagne details. Follow the page recipes, not just the color table.

Start with Phases 0 and 1: inspect the current app, then build the theme
foundation and a complete public homepage reference with its shell,
search, project cards, and shared controls. Treat later phases as backlog
for this first task and report them clearly at the end.

Read the repository instructions, SDLC skill, session context, UI guide,
and relevant installed Next.js docs. Preserve all existing work. Record
the brief's visual direction as my task-scoped exception to the old
blue/slate visual recipe; retain all accessibility and domain controls.
Score the request and exact proposed files before implementation. Follow
the returned gates; this prompt does not override protected-change gates.

Reuse actual component APIs and semantic tokens. Preserve both themes,
theme preferences, portaled overlays, responsive layouts, and current
business behavior. Use real approved project imagery or a truthful
fallback. Do not invent property data or introduce new dependencies.

Proceed through the authorized scope, verify the result, and provide
before/after visual evidence where available, check results, limitations,
changed files, and rollback. Do not stop at a palette swap or claim the
entire application is redesigned after completing the homepage.
```

## 9. Evidence for preparing this brief

- Read the supplied design document, repository instructions, session context, UI guide, and relevant local source for tokens, homepage, cards, buttons, shells, layouts, and portal usage.
- Request-only and exact-file SDLC scoring both returned R0, no matched rules, with evidence/source review and human acceptance gates.
- Deliverable scope: this Markdown file only. Application files and the original Downloads document remain unchanged by this task.
- Self-check: source paths and named APIs were checked; proposed values and layouts are distinguished from current behavior. Implementation risk must be scored separately.
- Runtime tests/build and visual checks: not run for this documentation-only change. This brief does not certify contrast, accessibility, or rendered appearance.
- Rollback: remove only this newly added document. Human acceptance of the brief remains pending.
