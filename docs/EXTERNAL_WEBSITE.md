# External Website Maintenance

## Ownership

| Concern | Owner |
| --- | --- |
| Brand, canonical URL, provider IDs | `src/config/app.ts`, `src/config/public-site.ts` |
| Static public copy | `src/config/public-content.ts` |
| Project, layout, unit, SEO, FAQ data | PostgreSQL schema and Admin Project Content |
| Public project queries | `src/lib/public/projects.ts` |
| Customer account queries | `src/lib/public/account.ts` |
| Operational mutation audit | `src/lib/audit/log.ts` |
| Campaign events and consent | `src/lib/public/analytics.ts` |

## Adding Public Features

1. Prefer a Server Component page and isolate only interactive controls as Client Components.
2. Reuse catalog/account query modules instead of querying Drizzle from multiple pages.
3. Add editable project marketing content to the existing Admin Project Content workflow.
4. Add metadata, canonical URL, and structured data for indexable routes.
5. Use semantic theme tokens and test light, dark, system, mobile, and reduced-motion modes.
6. Audit meaningful writes. Do not put high-volume page views in `audit_logs`.

## Marketing Providers

Google Analytics, Google Ads, Meta Pixel, and TikTok Pixel are optional. Scripts render only when their environment ID is valid and the visitor grants marketing consent. Configure `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`, `NEXT_PUBLIC_META_PIXEL_ID`, and `NEXT_PUBLIC_TIKTOK_PIXEL_ID` in the deployment environment; malformed IDs are ignored.

Lead conversions use the normalized `generate_lead` event. It maps to GA4 `generate_lead`, Google Ads `conversion` with the configured `send_to` target, Meta `Lead`, and TikTok `SubmitForm`. Client-side navigation emits provider page views after the initial provider page view. Reopening Privacy choices revokes active provider consent before presenting the banner again.

First-touch UTM values, referrer, and supported Google/Meta/TikTok click IDs persist in session storage only after marketing consent is granted. Lead submissions without consent contain no campaign, click, query-string, or referrer attribution.

Only `NEXT_PUBLIC_APP_ENV=prod` is indexable. Local, UAT, and preproduction deployments emit `noindex, nofollow` and `Disallow: /`. Every indexable static page has a canonical URL and complete Open Graph/Twitter metadata; projects use their CMS-selected image and other pages use the generated `/social-image` bitmap.

## Project Marketing CMS

Admin Project Content is the sole owner of draft, immediate, and scheduled publication. Generic project creation always creates a draft, and generic project editing cannot bypass the content workflow. Future scheduled projects remain absent from public catalog queries, project routes, and the sitemap until their publication instant.

The content workflow manages SEO and Open Graph copy, canonical URLs, hosted `.mp4`/`.webm` hero video, highlights, FAQs, amenities, tags, nearby places, and social-image selection. Public metadata uses the selected social image and falls back to the first project-media image. Removing the selected item clears the selection without leaving stale public metadata.

Project media currently accepts validated external HTTPS image URLs ending in `.jpg`, `.jpeg`, `.png`, `.webp`, or `.gif`. It does not claim direct binary upload: durable upload requires configured R2/S3-compatible object storage. External file records are deduplicated and retained when a project-media association is removed because the shared file model can be referenced by other domains.

Marketing, publication, social-image, media, amenity, tag, and nearby-place mutations write Admin audit records. Project mutation APIs return `401` for anonymous requests and `403` for authenticated users outside ADMIN/SUPER_ADMIN.

## Customer Data Linkage

New authenticated enquiries link `leads.customer_user_id` only when the submitted phone or email matches the authenticated identity. Historical anonymous records use phone/email fallback in the account query. This prevents an authenticated account from claiming unrelated lead history.

## Customer Profile Security

Authenticated CUSTOMER users can edit their name and nationality under `/account/profile`. These non-login details synchronize only to active leads explicitly linked by `customer_user_id`; profile edits never claim unlinked historical leads.

Changing the login mobile number requires a dedicated `PHONE_CHANGE` OTP challenge bound to the current user and new number. The current number remains active until confirmation succeeds. Requests enforce resend cooldowns across target numbers, reject user/lead ownership conflicts, and consume the verified challenge in the same transaction as the user and linked-lead update. Real email addresses are preserved; generated `@phone.propertygojb.local` addresses follow the verified phone. Email editing remains disabled until a verified email delivery channel is configured.

Profile updates, phone-change requests, and confirmed phone changes write `UPDATE_PROFILE`, `REQUEST_PHONE_CHANGE`, and `CONFIRM_PHONE_CHANGE` audit events. Post-login deep links are restricted by role to `/account`, `/agent`, or `/admin` route prefixes.

## Viewing Request Lifecycle

Public viewing requests reuse `lead_activities` with `activity_type = VIEWING_APPOINTMENT`; no parallel appointment table is introduced. The customer selects a preferred Malaysia date/time, and the API stores it with `appointmentStatus = REQUESTED`. This is not a confirmed slot.

Admin triages unassigned requests. After assignment, Admin or the assigned Agent reviews the lead and saves the appointment details, which changes the status to `SCHEDULED` and moves the lead to `APPOINTMENT_SET`. Completion, cancellation, and reopening continue through the existing appointment actions. Public creation, staff confirmation/updates, and status actions write audit records. Authenticated customers can review requested and confirmed appointments under `/account/viewings`.

Requests are validated server-side in `src/lib/public/viewing.ts`: 30-minute increments, 9:00 AM to 6:00 PM Malaysia time, at least one hour of notice, and no more than 180 days ahead. Identical active requests for the same lead, project, and instant reuse the existing activity.

## Database Changes

The external foundation adds project SEO/social/highlight/FAQ fields and customer linkage in `drizzle/0003_plain_victor_mancha.sql`. Secure phone changes add the `PHONE_CHANGE` OTP purpose in `drizzle/0004_uneven_forge.sql`. Apply migrations with `npm run db:migrate` before using Admin marketing content or customer account features.

## Mock Data

Use database seeds under `src/db/seeds/` for realistic development records. Static content fixtures belong in `src/config/public-content.ts`. Never ship mock projects or units as a fallback when the production database is empty; render an explicit empty state instead.
