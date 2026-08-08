# Realtime Public Project Updates

To publish project visibility and content updates to customers immediately, create a free Ably app and add its API key to your deployment environment:

```env
ABLY_API_KEY="your-ably-api-key"
NEXT_PUBLIC_ABLY_ENABLED="true"
```

`ABLY_API_KEY` remains server-only. Public browsers receive short-lived tokens restricted to subscribing to the `public-projects` channel. When Ably is not configured, public pages use a visibility-aware 60-second version check instead.

# PropertyGoJB

PropertyGoJB is one Next.js application with three product surfaces:

- **External website and customer account**: project discovery, enquiries, bookings, and profile.
- **Agent portal**: operational lead, booking, customer, document, and appointment workflows.
- **Admin portal**: catalog, users, agents, CRM, governance, reporting, and settings.

## Local Setup

1. Copy `.env.example` to `.env.local` and provide a PostgreSQL connection plus a strong Better Auth secret.
2. Install dependencies with `npm install`.
3. Apply migrations with `npm run db:migrate`.
4. Seed required lookup data with `npm run db:seed`.
5. Start development with `npm run dev`.

The public site is available at `http://localhost:3000`. Admin and agent access depend on the assigned database role.

## Validation

Run these before merging:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Architecture Rules

- Keep production catalog, inventory, lead, and booking data in PostgreSQL. Do not copy database records into mock files.
- Put static public presentation copy in `src/config/public-content.ts`.
- Put brand, canonical URL, contact, and provider configuration in `src/config/app.ts` and `src/config/public-site.ts`.
- Reuse `src/components/common/` across systems when behavior is genuinely shared. Keep role-specific workflows in their own component trees.
- Record meaningful business mutations with `src/lib/audit/log.ts`. Page views and campaign events belong in the consented analytics layer.
- Use semantic theme classes (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`) for new UI.
- Use `AppReveal` for viewport motion. It automatically respects reduced-motion preferences.

See [docs/EXTERNAL_WEBSITE.md](docs/EXTERNAL_WEBSITE.md) for extension and marketing guidance and [docs/EXTERNAL_QA.md](docs/EXTERNAL_QA.md) for evidence-based completion gates.
