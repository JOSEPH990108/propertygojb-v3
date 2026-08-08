# External Website QA Matrix

A workstream is complete only when its implementation and applicable checks below pass. Record provider-dashboard checks separately because they require production credentials.

## 1. Visual, Responsive, and Accessibility

- Test `/`, `/projects`, a project detail, `/about`, `/contact`, `/book-viewing`, `/privacy`, and `/terms` at 390x844 and 1440x900.
- Verify light, dark, and system themes survive server render and client navigation without hydration errors.
- Verify one `main` landmark, one visible `h1`, no horizontal overflow, named controls, visible keyboard focus, mobile navigation, and reduced-motion rendering.
- Exercise consent choices and enquiry success with a mocked API response to avoid test CRM records.
- Review screenshots because numeric overflow checks do not detect obscured content or poor visual hierarchy.

## 2. Viewing Workflow

- Validate timezone-aware date and slot rules on both client and API; never trust client availability.
- Test slot conflict/concurrency handling, CRM activity, audit entry, customer account visibility, and staff status changes.
- Cover anonymous and authenticated requests, duplicate submissions, invalid projects, unavailable slots, and cancellation/rescheduling.

## 3. Secure Profile Editing

- Require an authenticated CUSTOMER and current-password/OTP reverification before changing verified identity fields.
- Test ownership, validation, duplicate phone/email handling, session behavior, audit before/after values, and rate limiting.
- Do not expose internal CRM notes or allow profile changes to claim unrelated historical leads.

## 4. Project Marketing CMS

- Test Admin authorization, external image ingestion/selection, publish scheduling, hero-video validation, fallback media, and removal.
- Verify public metadata, JSON-LD, sitemap inclusion, social previews, unpublished behavior, and mobile media rendering.
- Audit every published content mutation with meaningful before/after values.
- Treat direct binary upload as pending until durable R2/S3-compatible storage is configured; the current CMS accepts validated external HTTPS image URLs.

## 5. Analytics and SEO

- Verify zero marketing provider requests before consent and correct loading after consent.
- Test normalized conversion payloads and UTM/click-ID attribution without storing secrets or unnecessary PII.
- Validate canonical URLs, robots, sitemap, titles/descriptions, structured data, redirects, and 404 behavior.
- Verify GA4, Google Ads, Meta, and TikTok events in their production test/debug dashboards using real IDs.

## 6. Audit Coverage and Automated Tests

- Inventory every mutation route and classify it as business audit, operational activity, security log, or intentionally excluded telemetry.
- Test authorization, validation, deduplication, ownership, state transitions, audit payloads, and failure rollback.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before completion.

## 7. Database Lifecycle Review

- Review foreign keys, nullability, uniqueness, soft-delete behavior, indexes, query plans, and concurrent state changes.
- Define PII retention/deletion, audit immutability, account-link migration, media lifecycle, and backup/restore expectations.
- Generate and review additive migrations, test against representative data, and document rollback or forward-fix steps.

## Current Browser Baseline

On 31 July 2026, automated browser QA confirmed all eight public routes return successfully at desktop/mobile widths with no horizontal overflow, one main landmark, one h1, named enquiry controls, working mobile navigation, consent denial with no provider scripts, and correct mocked enquiry attribution. It also found and fixed theme hydration, duplicate landmarks, reduced-motion transforms, inaccessible form labels, hardcoded select colors, and an oversized mobile consent panel.

Authenticated profile QA on 31 July 2026 used a disposable CUSTOMER account and confirmed mobile layout/accessibility, name/nationality persistence, phone OTP request and confirmation, target-switch cooldown, old-number rejection, session continuity, exact post-login deep-link restoration, and cross-portal redirect rejection. The database contained all three expected profile audit actions. The disposable user and its session, account, OTP, and audit records were removed after verification.

Project marketing CMS QA on 1 August 2026 used a disposable ADMIN and draft project. It confirmed anonymous `401` and CUSTOMER `403` mutation rejection; HTTPS canonical, hosted-video, and image-extension validation; future-scheduled route `404` and sitemap exclusion; immediate publication; configured canonical/Open Graph output; FAQ JSON-LD; sitemap inclusion; hosted MP4 rendering with selected poster; OG cleanup after selected-media removal; and lifecycle audit records. The mobile Admin editor rendered without horizontal layout failure. Disposable database and temporary HTTP-client records were removed after verification.

Analytics and SEO hardening on 1 August 2026 confirmed local `Disallow: /` plus `noindex, nofollow`; canonical, locale, site-name, Open Graph, Twitter, and generated 1200x630 social-image output; successful responses for all seven static public routes, robots, and sitemap; provider-ID sanitization; consent-gated first-touch attribution; no tracking attribution without consent; GA4/Google Ads/Meta/TikTok lead-event mapping; and client-navigation page-view support. Production dashboard validation remains deployment-specific because it requires the real provider IDs and conversion label.
