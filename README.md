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

Agent-assisted code, dependency, schema, configuration, and executable-workflow changes use the complete clean-CI command matrix in [docs/AI_AGENTIC_SDLC.md](docs/AI_AGENTIC_SDLC.md#121-clean-checkout-merge-baseline). Record every command as Pass, Fail, or `N/A—reason` in [the change-evidence template](docs/templates/AI_CHANGE_EVIDENCE.md); an accountable reviewer must approve every N/A.

## Architecture Rules

- Keep production catalog, inventory, lead, and booking data in PostgreSQL. Do not copy database records into mock files.
- Put static public presentation copy in `src/config/public-content.ts`.
- Put brand, canonical URL, contact, and provider configuration in `src/config/app.ts` and `src/config/public-site.ts`.
- Reuse `src/components/common/` across systems when behavior is genuinely shared. Keep role-specific workflows in their own component trees.
- Record meaningful business mutations with `src/lib/audit/log.ts`. Page views and campaign events belong in the consented analytics layer.
- Use semantic theme classes (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`) for new UI.
- Use `AppReveal` for viewport motion. It automatically respects reduced-motion preferences.

See [docs/EXTERNAL_WEBSITE.md](docs/EXTERNAL_WEBSITE.md) for extension and marketing guidance and [docs/EXTERNAL_QA.md](docs/EXTERNAL_QA.md) for evidence-based completion gates.

## Agentic SDLC Quick Start

1. Open Copilot Chat and select **Agent** mode.
2. Describe the outcome in a few sentences; you do not need to complete a template.
3. Let the agent inspect the current code, load active business rules, calculate risk, and propose the file scope.
4. Review the risk decision: R0 is read-only, R1 and eligible R2 work may proceed automatically, R3 pauses for your explicit approval after planning, and R4 provides advice for a human to execute.
5. Review the changed files, checks, evidence, and remaining risks before approving a merge.

Example request:

> Add an archive option for inactive property listings. Archived listings must not appear publicly, but administrators can restore them.

For an R3 plan, continue only when ready by replying: `Approved, continue with the proposed R3 plan.`

Inspect or validate the decision manually when useful:

```bash
npm run sdlc:score -- --request "Add a favourites feature"
npm run sdlc:score -- --request "Change booking status" --files "src/lib/bookings/status.ts,src/app/api/internal/bookings/status/route.ts"
npm run sdlc:rules
npm run sdlc:validate
npm run test:sdlc
```

The durable session map is [docs/sdlc/SESSION_CONTEXT.md](docs/sdlc/SESSION_CONTEXT.md), and the canonical machine-readable memory is [docs/sdlc/business-rules.json](docs/sdlc/business-rules.json). Proposed learned rules do not apply until a human approves them as active.

See [the complete Agentic SDLC and automatic-runner guide](docs/AI_AGENTIC_SDLC.md#24-automatic-rough-request-execution-and-business-rule-memory), [the work-item template](docs/templates/AI_AGENT_WORK_ITEM.md), and [the change-evidence template](docs/templates/AI_CHANGE_EVIDENCE.md).
