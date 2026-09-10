**PROPERTYGO**

Internal WhatsApp Automation & Lead Management

Full build specification for the first internal release

> **Purpose**
> Build a reliable internal system that captures Meta Click-to-WhatsApp enquiries, guides prospects with structured interactive replies, gives PropertyGo agents a shared inbox, and turns conversations into trackable leads, appointments, bookings, and follow-ups.

| **Document owner**      | PropertyGo Product & Engineering                                                          |
|-------------------------|-------------------------------------------------------------------------------------------|
| **Primary users**       | PropertyGo administrators and assigned property agents                                    |
| **Release target**      | Internal V1 - one WhatsApp Business Account / one operational workspace                   |
| **Technology baseline** | Next.js App Router, TypeScript, PostgreSQL, Drizzle ORM, Better Auth, Tailwind, shadcn/ui |
| **Status**              | Implementation-ready specification                                                        |
| **Date**                | 17 August 2026                                                                            |

## **How to use this document**

This is a build specification, not a concept paper. It defines the V1 scope, user journeys, data model, interface behavior, API contracts, security requirements, rollout checklist, and acceptance tests. Use it to plan tickets or give to an implementation agent in logical phases.

> **V1 decision**
> PropertyGo builds for its own internal operations first. The architecture must keep company and WhatsApp account boundaries explicit, but self-serve client onboarding, billing, visual flow builders, and multi-channel messaging are out of scope.

# **Document map**

| **Section**                | **What it answers**                                                       |
|----------------------------|---------------------------------------------------------------------------|
| 1\. Product charter        | Why V1 exists, who uses it, what success looks like.                      |
| 2\. Scope and boundaries   | Exactly what is included now and consciously deferred.                    |
| 3\. Users and permissions  | Admin and agent responsibilities.                                         |
| 4\. Architecture and setup | Cloud API, webhooks, application services, credentials, environments.     |
| 5\. Conversation design    | Property lead qualification, button/list menu flows, takeover rules.      |
| 6\. Data and APIs          | Entities, schemas, state transitions, endpoints, idempotency.             |
| 7\. Internal inbox UX      | Screens, filters, assignment, lead timeline, message composer.            |
| 8\. Automation operations  | Templates, follow-ups, queues, alerts, reports.                           |
| 9\. Delivery plan          | Phases, testing, deployment, release checklist.                           |
| Appendices                 | Message copy, environment variables, event taxonomy, acceptance criteria. |

## **Product principles**

- Human-first, automation-assisted: a qualified lead must reach a real agent quickly; the bot never becomes a barrier.

- Property context must be project-aware: facts, price ranges, brochures, unit availability and assigned agents come from PropertyGo data—not hardcoded prompts.

- Every customer event is auditable: original inbound message, automation decision, agent assignment, sent message and delivery state are retained.

- V1 should be structured before it is “AI”: deterministic button/list flows are the default. AI is optional later for FAQ summarisation and intent support.

- The platform must respect WhatsApp policies: only reply freely in an active customer-service window; use approved templates for later outbound contact.

# **1. Product charter**

## **1.1 Problem to solve**

Meta ads create enquiries at all hours, but agents receive unstructured chats, respond at inconsistent speeds, manually forward brochures, and lose campaign context. V1 centralises the conversation, captures intent early, routes ownership, and makes the next best action visible to the team.

## **1.2 V1 outcomes**

| **Outcome**          | **Operational definition**                                                                           | **Success signal**                                  |
|----------------------|------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| Fast acknowledgement | A new eligible inbound enquiry receives a clear response or menu immediately.                        | Median first automated response under 60 seconds.   |
| Better qualification | The lead selects a project interest, requested topic and preferred action before or during handover. | At least 70% of new leads have a captured intent.   |
| Clear ownership      | Every active lead has a visible assigned agent or an explicit unassigned queue.                      | No conversation without an owner after routing SLA. |
| Follow-through       | Viewing, booking and follow-up actions are recorded on the PropertyGo lead timeline.                 | Agents can audit the full journey in one place.     |
| Campaign learning    | Source, campaign/ad identifiers and initial enquiry content are linked where available.              | Reports show leads and outcomes by project/source.  |

## **1.3 Non-goals for V1**

- No public multi-company onboarding or tenant billing.

- No bulk marketing broadcast engine or cold outbound messaging.

- No replacement for PropertyGo bookings, appointments, customers, documents, or project catalogue—this module integrates with them.

- No autonomous negotiation, legal/financial advice, guaranteed unit availability, or AI-written price promises.

- No WhatsApp Web scraping, unofficial automation libraries, or agent use of shared access tokens.

# **2. Scope and release boundary**

| **Included in V1**                                                                                                                                               | **Deferred after V1**                                                                                                |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| Cloud API webhook verification; inbound text, reply-button and list-reply processing; outbound text, interactive menus, documents/media links and read receipts. | Multi-WABA self-serve embedded signup, automated Meta business provisioning, customer billing and usage metering.    |
| Shared desktop inbox; message timeline; assignment; internal notes; agent takeover; lead detail drawer; basic saved replies.                                     | Drag-and-drop visual workflow builder, autonomous AI agent, voice-note transcription and omnichannel inbox.          |
| Project-aware welcome menu; brochure send; enquiry capture; viewing-request handoff; lead statuses; activity log; basic routing rules.                           | Advanced lead scoring, campaign optimisation, custom analytics warehouse and automatic agent performance incentives. |
| Approved template registry/status view and manual template-send action with consent guard.                                                                       | Template creation workflow via Meta management API and scheduled mass campaign management.                           |

# **3. Users, roles and permissions**

Reuse PropertyGo’s existing Better Auth and permission-level RBAC model. Do not create a separate WhatsApp login system. All access must be evaluated server-side and auditable.

| **Role**    | **Primary jobs**                                                                                                      | **Required permissions**                                                                                        |
|-------------|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| SUPER_ADMIN | Configure WhatsApp connection, automation defaults, routing rules, templates, retention and system-level diagnostics. | Full workspace configuration; credential references; audit/event access.                                        |
| ADMIN       | Monitor queues, manage projects/agents, assign conversations, intervene in workflows, review reports.                 | View all conversations/leads; assign/reassign; send messages; manage approved templates; view reports.          |
| AGENT       | Handle assigned conversations, send approved replies, create follow-ups, book viewings and update lead outcomes.      | View assigned conversations/leads; send messages; add private notes; request reassignment; create appointments. |
| CUSTOMER    | No internal inbox access. May interact only through WhatsApp and existing customer-facing PropertyGo paths.           | No staff permissions.                                                                                           |

## **3.1 Mandatory permission rules**

- Only SUPER_ADMIN can change WhatsApp credentials, webhook settings, message retention or global automation settings.

- Agents can never view or send into conversations outside their assignment unless an ADMIN explicitly grants shared-queue access.

- All reassignments, takeover toggles, template sends and status changes create lead activities.

- An agent message must identify its sender internally, even when WhatsApp presents the business name to the customer.

# **4. System architecture**

> **Recommended architecture**
> Keep WhatsApp integration server-only inside PropertyGo. The browser never sees Meta tokens. The webhook receives events, persists them idempotently, enqueues/executes routing, then sends a response through a dedicated WhatsApp service module.

| **Layer**           | **Responsibility**                                                                | **Implementation**                                                                    |
|---------------------|-----------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| Meta / WhatsApp     | Inbound events, message delivery, interactive replies, templates.                 | WhatsApp Cloud API; one WABA and API phone number for V1.                             |
| Webhook boundary    | Verify Meta signature, parse payload, deduplicate, acknowledge promptly.          | Next.js route handler; raw-body signature verification; durable webhook event record. |
| Domain services     | Conversation state, routing, interactive payloads, template policy, lead linkage. | Server-only TypeScript services and Drizzle transactions.                             |
| PropertyGo database | Conversations, messages, lead activities, assignments, follow-ups, audit events.  | PostgreSQL with Drizzle migrations and foreign keys.                                  |
| Internal interface  | Inbox, lead details, action panels and reports.                                   | Existing admin/agent routes, TanStack Table, React Hook Form, shadcn/ui.              |

## **4.1 Repository placement**

```text
app/api/webhooks/whatsapp/route.ts # GET verification + POST event intake
app/api/admin/whatsapp/conversations/route.ts # inbox list/query
app/api/admin/whatsapp/conversations/[id]/route.ts
app/api/admin/whatsapp/conversations/[id]/messages/route.ts
app/api/admin/whatsapp/conversations/[id]/assign/route.ts
app/api/admin/whatsapp/templates/route.ts
app/admin/whatsapp/inbox/page.tsx
app/agent/inbox/page.tsx
lib/whatsapp/client.ts # Meta API client
lib/whatsapp/webhook.ts # parse + validation
lib/whatsapp/flows/property-enquiry.ts # deterministic V1 flow
lib/whatsapp/routing.ts # queue and assignment rules
lib/whatsapp/policy.ts # 24h/template guard
lib/whatsapp/types.ts
db/schema/whatsapp.ts
db/schema/leads.ts
```

# **5. Meta setup and credential preparation**

## **5.1 What PropertyGo must prepare**

| **Item**                                       | **Owner**                    | **Why it is needed**                                                |
|------------------------------------------------|------------------------------|---------------------------------------------------------------------|
| Meta Business Portfolio                        | Business owner / SUPER_ADMIN | Owns the WhatsApp Business Account, users and business settings.    |
| WhatsApp Business Account and API phone number | Business owner               | The identity that sends and receives WhatsApp messages.             |
| Meta developer app                             | Engineering                  | Provides Cloud API configuration, webhooks and access control.      |
| Long-lived system-user token                   | SUPER_ADMIN + engineering    | Production server authentication. Do not use a browser/test token.  |
| Public HTTPS domain                            | Engineering                  | Webhook callback URL; must be reachable by Meta.                    |
| Verified business information                  | Business owner               | Required as Meta requests it for production capabilities and trust. |
| Privacy policy and consent wording             | Business owner               | Required for responsible lead handling and later re-engagement.     |

## **5.2 Environment variables**

```env
# WhatsApp / Meta
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WABA_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_GRAPH_API_VERSION=

# Application
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
BETTER_AUTH_SECRET=

# Optional operational notifications
WHATSAPP_ALERT_RECIPIENTS=
SENTRY_DSN=
```

> **Credential rule**
> Store tokens only in the deployment secret manager. Never commit them, place them in client-side environment variables, log them, or show them in the internal settings UI after save. Settings UI should show only masked values and last-verified timestamps.

## **5.3 Setup checklist**

1.  Create the Meta app, add the WhatsApp product, and record WABA ID plus Phone Number ID.

2.  Configure a public GET/POST webhook URL and a private verify token. Subscribe to the required message and status fields.

3.  Create a system user and production token with only the permissions needed to send and manage WhatsApp messages.

4.  Use the test number to validate inbound text, button replies, list replies, delivery/read statuses and document messages.

5.  Add the production number only after webhook retry, duplicate handling and internal access checks pass.

6.  Create and obtain approval for required post-window follow-up templates before launching ads.

# **6. Conversation design: PropertyGo V1**

V1 is deterministic. The engine uses a small state machine and interactive UI; it does not need an LLM to deliver useful results. Every flow response is project-aware and has a defined safe fallback.

## **6.1 Core lead journey**

| **Stage**     | **System action**                                                                                         | **Information captured**                                        |
|---------------|-----------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Inbound       | Create or reopen a conversation. Match contact by normalized WhatsApp ID. Mark message as read.           | Phone, message ID, received time, raw source data.              |
| Welcome       | Send project-specific greeting if an ad/project context is known; otherwise send general PropertyGo menu. | Initial project or “not yet known”.                             |
| Intent menu   | Offer max three reply buttons, otherwise one list menu.                                                   | Price, brochure, viewing, unit/location, financing, other.      |
| Qualification | Ask one short question at a time only when needed.                                                        | Budget band, property type, preferred viewing period, language. |
| Handover      | Assign agent using project/routing rules; notify agent; send a human-expectation message.                 | Assigned agent and handover timestamp.                          |
| Action        | Agent sends brochure, creates viewing appointment, records outcome and follow-up.                         | Appointment/booking link, lead status, next action.             |

## **6.2 Default opening flow**

```text
Customer: Hi

PropertyGo: Welcome to PropertyGo. What would you like to explore first?
[Price & payment] [Get eBrochure] [Book a viewing]

If “Price & payment”:
PropertyGo: Which project would you like to know more about?
[List menu: Skudai Rooftop Cluster / M Tiara / Bandar Seri Alam / Other project]

If a project is selected:
PropertyGo: {{project_name}} is currently from {{display_price}}. Would you like to view payment guidance or receive the complete brochure?
[Payment guidance] [Get eBrochure] [Arrange consultant contact]

Note: Chinese, English and Malay text are resolved from the approved project-language content records; do not hardcode live copy in the workflow.
```

## **6.3 V1 conversation rules**

- Reply in the lead’s detected/preferred language: Chinese, English or Malay. If uncertain, ask one language-choice question.

- Keep each automated message concise: one purpose, no long sales essay, and no unsupported claims.

- Use structured IDs such as \`intent.price\`, \`project.skudai_cluster\`, and \`action.viewing_request\`; never route business logic from display text.

- Before stating price, availability, rebate or loan terms, resolve current data from the project record. If data is missing/stale, hand over to a human instead of guessing.

- The customer can request handover at any time using configured English, Chinese or Malay keywords such as agent, human, consultant, ejen, visit or viewing.

- After human takeover, pause non-essential automation. The system may still log events, display suggested replies and send required transactional messages.

# **7. Flow catalogue and routing**

| **Flow**                  | **Trigger**                                        | **System behaviour**                                                                  | **Exit / owner**                                  |
|---------------------------|----------------------------------------------------|---------------------------------------------------------------------------------------|---------------------------------------------------|
| General welcome           | New text without a known project.                  | Offer intent menu and project list.                                                   | Stay automated until selected or human requested. |
| Project enquiry           | Known project/deep-link or selected list row.      | Load approved project facts; offer price, brochure, layout/location, viewing.         | Assigned project agent or project queue.          |
| eBrochure request         | Button/list selection.                             | Record interest; send latest approved brochure/document or secure public URL.         | Agent follows up within SLA.                      |
| Viewing request           | Button, keyword, or appointment request.           | Collect preferred day/time and party size only if needed; create appointment request. | Assigned agent confirms manually.                 |
| Price/loan query          | Price button or keyword.                           | Show approved price range and calculator/deep-link; collect budget band.              | Agent for detailed financing.                     |
| Existing booking/customer | Known contact with active booking or booking code. | Show safe status prompt and direct to assigned agent.                                 | Assigned booking agent.                           |
| Unmatched/off-topic       | No recognized intent.                              | Offer general project list and human option.                                          | General lead queue.                               |
| Opt-out / complaint       | STOP / unsubscribe / complaint text.               | Record preference; stop non-transactional follow-up; alert admin when needed.         | Admin review.                                     |

## **7.1 Routing decision order**

1.  If a lead has an active booking, appointment, or explicit assigned agent, retain that owner unless an ADMIN overrides it.

2.  Otherwise, if the conversation is linked to a project, route to that project’s enabled agent queue using a clear round-robin or capacity rule.

3.  Otherwise, if source/campaign maps to a project, route to that project queue.

4.  Otherwise, route to the default PropertyGo general enquiry queue.

5.  If no eligible agent is online/available, retain in the queue and raise an admin SLA alert—never silently drop the lead.

## **7.2 Agent handover message**

```text
Chinese: Use approved project-language content from the message library.
English: Thanks — I’ve passed this to the relevant PropertyGo consultant. They’ll reply shortly. You may also share your preferred viewing date and time.
Malay: Baik, kami telah serahkan pertanyaan anda kepada perunding yang berkaitan. Mereka akan membalas secepat mungkin. Anda juga boleh kongsikan tarikh dan masa lawatan pilihan anda.
```

# **8. Data model and state management**

Use existing contacts/customers/leads wherever possible. The WhatsApp module adds communication-specific tables and links them to the existing lead, customer, project, agent, appointment and booking records.

| **Entity**              | **Key fields**                                                                                                                                          | **Purpose**                                                                             |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| whatsapp_accounts       | id, display_name, waba_id, phone_number_id, status, token_ref, last_verified_at                                                                         | Connection record; V1 has one active account but do not hardcode singleton assumptions. |
| whatsapp_contacts       | id, account_id, wa_id, normalized_phone, profile_name, language, consent_status, contact_id/customer_id                                                 | Maps WhatsApp identity to PropertyGo person records.                                    |
| whatsapp_conversations  | id, account_id, contact_id, lead_id, project_id, assigned_agent_id, status, automation_state, last_message_at, opened_at, customer_service_window_until | Single operational thread and ownership.                                                |
| whatsapp_messages       | id, conversation_id, meta_message_id, direction, type, text, payload_json, sender_user_id, status, sent_at, delivered_at, read_at, failed_at            | Immutable message timeline and delivery state.                                          |
| whatsapp_webhook_events | id, event_key, payload_json, received_at, processed_at, process_status, error                                                                           | Idempotency, replay and troubleshooting.                                                |
| whatsapp_assignments    | id, conversation_id, agent_id, assigned_by, assigned_at, reason, ended_at                                                                               | Ownership history.                                                                      |
| whatsapp_follow_ups     | id, conversation_id, due_at, type, assigned_agent_id, status, template_key, completed_at                                                                | Explicit next-action queue.                                                             |
| whatsapp_flow_events    | id, conversation_id, node_key, action_id, input_value, occurred_at                                                                                      | Reports on button/menu and flow performance.                                            |

## **8.1 Conversation status**

| **Status**       | **Meaning**                                                        | **Allowed next transition**                    |
|------------------|--------------------------------------------------------------------|------------------------------------------------|
| OPEN             | New or actively handled conversation.                              | PENDING_AGENT, WAITING_CUSTOMER, CLOSED, SPAM. |
| PENDING_AGENT    | Automation has requested human follow-up or routing is unresolved. | OPEN, WAITING_CUSTOMER, CLOSED.                |
| WAITING_CUSTOMER | Agent/system has sent a meaningful reply and awaits response.      | OPEN, CLOSED.                                  |
| CLOSED           | No active work; can reopen on next customer message.               | OPEN.                                          |
| SPAM             | Invalid, abusive or non-lead thread.                               | OPEN only by admin override.                   |

## **8.2 Event processing and idempotency**

> **Non-negotiable**
> Meta can retry webhook delivery. Derive a unique event key from the WhatsApp message ID/status event ID. Insert the webhook event with a unique database constraint before processing. If it already exists, return 200 without sending a duplicate reply.

- Persist inbound event first; do not rely on in-memory state.

- Acknowledge webhook transport quickly, then process through a durable job/outbox path where available.

- Use a transactional outbox for outbound messages: create message record + outbox row together; worker sends and records the resulting Meta message ID.

- Retry transport failures with bounded exponential backoff. Do not retry policy/validation errors without operator action.

# **9. API contracts and server services**

## **9.1 Webhook endpoint**

| **Method / route**                                    | **Authentication**                   | **Behaviour**                                                                                                 |
|-------------------------------------------------------|--------------------------------------|---------------------------------------------------------------------------------------------------------------|
| GET /api/webhooks/whatsapp                            | Meta verify token                    | Validate hub.mode, hub.verify_token and return hub.challenge. Return 403 for mismatch.                        |
| POST /api/webhooks/whatsapp                           | X-Hub-Signature-256 / app secret     | Validate raw-body signature; persist event idempotently; dispatch message/status handling; return 200 safely. |
| POST /api/admin/whatsapp/conversations/:id/messages   | PropertyGo session + send permission | Validate 24h/template policy, create outbound record/outbox, send text/media/interactive/template.            |
| POST /api/admin/whatsapp/conversations/:id/assign     | Admin assignment permission          | Assign/reassign, add activity and optionally notify agent.                                                    |
| POST /api/admin/whatsapp/conversations/:id/takeover   | Agent/admin access                   | Pause/resume automation and record reason.                                                                    |
| POST /api/admin/whatsapp/conversations/:id/follow-ups | Assigned agent/admin                 | Create/complete/reassign next action.                                                                         |
| GET /api/admin/whatsapp/conversations                 | Inbox access permission              | Filterable paginated list with unread count, owner, project, status and next action.                          |

## **9.2 Service responsibilities**

| **Module**                       | **Contract**                                                                                                                                         |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| whatsapp/client.ts               | Typed Cloud API wrapper for send text, interactive button, interactive list, template, media and mark-as-read. It must not contain business routing. |
| whatsapp/webhook.ts              | Raw payload validation and typed event extraction. Unknown payloads are logged, not thrown away silently.                                            |
| whatsapp/conversation-service.ts | Find/create contact and conversation; update timestamps/window; maintain status and lead linkage.                                                    |
| whatsapp/flow-engine.ts          | Evaluate deterministic state + action ID into a next action. Keep flow definitions as typed configuration, versioned by key.                         |
| whatsapp/routing.ts              | Select queue/agent; respect active ownership, project mapping, capacity and admin override.                                                          |
| whatsapp/policy.ts               | Check active customer-service window, consent, allowed template and message content policy before dispatch.                                          |
| whatsapp/outbox-worker.ts        | Deliver queued outbound messages, update status, retry safely and alert on terminal failure.                                                         |

## **9.3 Interactive message builder requirements**

- Reply button: maximum three actions. Every action has an internal stable ID and a display title under WhatsApp’s current limits.

- List menu: use for project selection or more than three actions. Store row ID, title, optional description and section key.

- Never embed a raw client-supplied ID directly into a callback without validating it against a flow version and available project/agent permissions.

- Outgoing interactive payload is persisted as JSON alongside a human-readable message preview so the inbox remains understandable.

# **10. Internal inbox: UX and behaviour**

## **10.1 Navigation**

Add “WhatsApp Inbox” to both ADMIN and AGENT navigation. ADMIN sees all permitted queues; AGENT enters a focused view of their assigned queue by default. The route should be desktop-first but remain usable on tablet widths.

| **Area**          | **Required behaviour**                                                                                                                                        |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Queue sidebar     | Saved views: My Open, Unassigned, Project Queues, Waiting Customer, Follow-ups Due, Closed. Display counts and unread indicators.                             |
| Conversation list | Show contact name/phone, project, latest preview, owner, last activity, SLA indicator and unread count. Support search by name, phone, lead ID, booking code. |
| Thread            | Chronological inbound/outbound bubbles, event chips for assignment/automation, template/media preview, delivery/read state and internal-only notes.           |
| Lead panel        | Contact, source, project interest, status, budget, language, assigned agent, appointments/bookings, tags and activity history.                                |
| Composer          | Text, safe saved replies, approved templates, media/document send, interactive menu preview, internal note toggle and handover controls.                      |
| Action rail       | Assign, change status, create viewing request, create follow-up, open lead/customer/booking, pause automation, mark spam/close.                               |

## **10.2 Critical interaction rules**

- Messages sent by a human must appear in the thread optimistically but only become “sent” after a successful delivery request; display failure and retry action when appropriate.

- Internal notes never leave the server for Meta. Make their visual treatment unambiguous and exclude them from customer-visible exports.

- Before a send outside the active window, disable free-form composer send and present only approved templates that match the required category/purpose.

- If a conversation is assigned to another agent, show ownership clearly and prevent accidental reply unless the user has takeover/override permission.

- Project data displayed in the panel should have a “last updated” timestamp to protect agents from sending stale prices or availability.

# **11. Automation operations**

## **11.1 Project knowledge source**

The automation must read current project data through a thin server-side repository, not from text in the flow file. The data owner is the existing PropertyGo project/catalog module.

| **Data required**                                          | **Source / rule**                                                                                |
|------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| Project name, slug, active status, property type, location | Existing project record; only active/listable projects can appear in public menus.               |
| Price display / financing disclaimer                       | Approved marketing fields with effective date; avoid recomputing financing claims in chat.       |
| Brochure / media                                           | Approved public asset or controlled signed link; record asset version sent.                      |
| Assigned agent pool                                        | Project-agent assignment; inactive users excluded from routing.                                  |
| Viewing procedures                                         | Project settings: viewing hours, lead time, required details, booking/contact rules.             |
| Translations                                               | Project content per supported language; fallback to English or human handover when not approved. |

## **11.2 Follow-up policy**

| **Trigger**          | **Create follow-up**                                                                                           | **Owner / SLA**                                                  |
|----------------------|----------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|
| eBrochure sent       | Follow up if no meaningful reply after configured delay; template required if outside customer-service window. | Assigned agent; default 1 business day.                          |
| Viewing request      | Confirm a human owner immediately; due action includes preferred date/time.                                    | Project agent; target within 15 minutes during operating hours.  |
| Lead asks price/loan | Create finance/price clarification action if agent needed.                                                     | Assigned agent; target within 30 minutes during operating hours. |
| Unassigned lead      | Queue alert when no assignment after routing SLA.                                                              | Admin; target within 10 minutes.                                 |
| Customer opt-out     | Cancel non-transactional follow-ups and preserve compliance event.                                             | System + admin audit.                                            |

## **11.3 Template guardrails**

- Store template name, language, category, current approval status, parameters, effective version and owner.

- A template-send form must validate that every required parameter is supplied and redacts sensitive values from broad logs.

- Allow only opted-in contacts for marketing follow-up; capture opt-in source/time where applicable.

- If the lead is inside the active customer-service window, prefer a normal contextual reply rather than a template.

# **12. Reporting and operational metrics**

| **Metric**                 | **Definition**                                                                            |
|----------------------------|-------------------------------------------------------------------------------------------|
| New WhatsApp conversations | Distinct conversations opened in period, by project/source/campaign where known.          |
| First response time        | Inbound receipt to first automated or human reply; report both separately.                |
| Human response SLA         | Time from handover/assignment to first human response.                                    |
| Intent conversion          | Share selecting price, brochure, viewing or other structured flow outcomes.               |
| Brochure-to-viewing rate   | Conversations with brochure sent that later create appointment/viewing request.           |
| Viewing-to-booking rate    | Linked viewing/appointment that leads to a booking record.                                |
| Agent workload             | Open assigned conversations, overdue follow-ups, response SLA and resolved conversations. |
| Message delivery health    | Sent/delivered/read/failed rates; terminal failure reasons.                               |

> **Report integrity**
> Never infer a booking conversion from message text alone. Link the conversation to the actual appointment/booking record and treat the conversion as confirmed only when that relationship exists.

# **13. Security, reliability and compliance**

| **Area**             | **Requirement**                                                                                                               |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------|
| Webhook authenticity | Verify Meta signature over the raw payload before parsing. Reject invalid signatures and log only safe metadata.              |
| Access control       | Server-side RBAC on every query/mutation. Filter conversations by allowed agent/project scope, not only on the client.        |
| Secrets              | Encrypted/managed secrets only; token references in database, no token plaintext in application tables or logs.               |
| PII                  | Treat phone numbers, chat content and lead data as personal data. Minimise access, audit exports and define retention policy. |
| Outbound safety      | Policy guard checks customer-service window, opt-out, template approval and assigned agent access before sending.             |
| Reliability          | Unique webhook event keys, transactional outbox, bounded retries, alerting for failed sends and dead-letter diagnostics.      |
| Observability        | Structured logs with correlation IDs: webhook event, conversation, lead, outbound message and Meta message ID.                |
| Backups              | Use existing PostgreSQL backup/restore process; regularly test restore of communication tables.                               |

## **13.1 Failure behaviours**

| **Failure**                           | **Required behaviour**                                                                                                |
|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Invalid webhook signature             | Return 401/403; do not process payload; record a security event without secrets.                                      |
| Duplicate event                       | Return 200; do not create duplicate message, lead activity or reply.                                                  |
| Meta send timeout                     | Keep outbox in retryable state; retry with backoff; surface “not sent yet” to agent.                                  |
| Meta policy/validation error          | Stop automatic retry; surface clear actionable error and send alert to admin if systemic.                             |
| Database failure during inbound event | Return a non-success response only when necessary so Meta retries; never send a reply without durable inbound record. |
| Project data missing                  | Do not fabricate. Send safe generic response and queue human assistance.                                              |
| Agent unavailable                     | Keep in queue; notify queue owner; tell customer a consultant will respond soon.                                      |

# **14. Implementation plan**

| **Phase**                    | **Deliverables**                                                                                                           | **Exit criteria**                                             |
|------------------------------|----------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| 0\. Foundation               | Migrations, permissions, environment validation, masked settings record, typed WhatsApp client.                            | Secrets work in staging; schema and RBAC tests pass.          |
| 1\. Webhook capture          | Verification, signature validation, raw event storage, dedupe, inbound text/status mapping, contact/conversation creation. | Test messages appear once only and delivery statuses update.  |
| 2\. Inbox core               | Admin/agent lists, thread, assignment, internal notes, text composer, message status, lead linkage.                        | An agent can safely take ownership and reply from PropertyGo. |
| 3\. Deterministic automation | Flow configuration, buttons/lists, project menus, brochure/viewing/price paths, human handover.                            | Test lead completes each core path with recorded events.      |
| 4\. Operational actions      | Follow-up queue, appointment request integration, template policy guard, saved replies, SLA alerts.                        | Team can work daily without manual spreadsheet tracking.      |
| 5\. Reporting and hardening  | Dashboards, error alerts, load/security tests, retention/export controls, production runbook.                              | Pilot metrics are reliable and launch checklist passes.       |

## **14.1 Recommended build order**

1.  Deliver Phase 1 with an echo-only safe response in a non-production test account.

2.  Deliver Phase 2 so humans can manage threads before relying on automation.

3.  Add only the three core PropertyGo interactive intents: price/monthly, eBrochure and viewing.

4.  Connect flow outcomes to leads, agents, appointments and bookings, then run a controlled Meta-ad pilot.

5.  Measure failure modes for two weeks before adding more projects, follow-ups or AI assistance.

# **15. Test plan and release acceptance**

## **15.1 Functional tests**

| **Area**           | **Acceptance test**                                                                                                                   |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Webhook            | Valid verification succeeds; invalid verify token fails; invalid signature fails; duplicate inbound event creates no duplicate reply. |
| Inbound processing | Text, button reply, list reply, media/document and status events map to correct stored records.                                       |
| Flow               | Each default menu action reaches correct state, captures events, uses current project data and offers human handover.                 |
| Inbox              | Agent sees only permitted conversations; admin can reassign; notes are private; send failures can be retried safely.                  |
| Lead links         | New chat creates/matches contact and lead; project selection updates interest; viewing action creates request/activity.               |
| Policy             | Outside active window free-form send is blocked; approved template can be selected; opt-out blocks non-transactional follow-up.       |
| Delivery           | Sent/delivered/read/failed statuses update correctly when Meta sends status webhooks.                                                 |
| Reporting          | Counts match raw conversation/message/activity records over a known test dataset.                                                     |

## **15.2 Pre-launch checklist**

- Production webhook URL passes Meta verification and signature test.

- System-user production token is stored in secret manager; no temporary token remains in deployment settings.

- At least one approved re-engagement/viewing template is available in every intended language.

- Default project facts, brochures and agent assignment queues are confirmed by the business owner.

- Agent SOP is communicated: open queue, takeover, private notes, handover, follow-up completion, opt-out handling.

- Failure alerts route to the named admin/engineering owner.

- A staged Meta Click-to-WhatsApp ad test has produced and completed at least five end-to-end test conversations.

- Backup, retention, access audit and incident owner are documented.

# **16. V1 operating SOP**

| **When**                     | **Agent / admin action**                                                                                                |
|------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| New unassigned lead          | Admin checks project/source routing, assigns owner or fixes queue. Agent responds within SLA after assignment.          |
| Bot has handed over          | Assigned agent reads full timeline and lead panel, then replies naturally—do not repeat questions already answered.     |
| Lead requests eBrochure      | Confirm correct project, send current brochure, create/verify follow-up and offer viewing next.                         |
| Lead requests viewing        | Capture/confirm date/time and attendance details, create appointment request, then update lead status.                  |
| Price/availability uncertain | Do not guess. Check project data or ask the designated project team, then reply with approved information.              |
| Lead asks to stop messages   | Record opt-out immediately; stop marketing follow-ups; keep required transactional replies only where lawful/necessary. |
| Message delivery fails       | Review error, retry if temporary, escalate systemic Meta failures to administrator/engineering.                         |

# **Appendix A. Initial PropertyGo message content**

## **A.1 General entry message**

```text
Chinese
Use the approved Chinese copy held in the project message library.

English
Hi 👋 Thanks for contacting PropertyGo. What would you like to explore first?
[Price & payment] [Get eBrochure] [Book a viewing]

Malay
Hi 👋 Terima kasih kerana menghubungi PropertyGo. Anda ingin mengetahui yang mana dahulu?
[Harga & ansuran] [Dapatkan eBrochure] [Atur lawatan]
```

## **A.2 Safe fallback**

```text
Chinese: Use the approved Chinese fallback held in the message library.
English: Thanks for your enquiry. I’ve asked the relevant consultant to follow up so we can give you accurate information.
Malay: Terima kasih atas pertanyaan anda. Kami telah serahkan kepada perunding yang berkaitan supaya anda menerima maklumat yang tepat.
```

## **A.3 Suggested saved replies for agents**

| **Key**                 | **Use**                  | **Suggested copy**                                                                                                   |
|-------------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------|
| brochure_sent           | After sending brochure   | I’ve sent the latest eBrochure for you. If you share your preferred viewing day, I can help arrange a suitable time. |
| viewing_confirm_pending | Viewing request received | Noted your preferred time. I’m checking the viewing arrangement and will confirm with you shortly.                   |
| price_check             | Data needs confirmation  | Let me confirm the latest available information with the project team so I can update you accurately.                |
| human_intro             | Agent takes over         | Hi, I’m {{agent_name}} from PropertyGo. I’ll assist you from here regarding {{project_name}}.                        |

# **Appendix B. Event taxonomy**

| **Event key**                    | **When it fires**                                |
|----------------------------------|--------------------------------------------------|
| whatsapp.inbound.received        | Valid customer message persisted.                |
| whatsapp.interactive.selected    | Button or list action selected.                  |
| whatsapp.flow.advanced           | Automation state moves to another node.          |
| whatsapp.conversation.assigned   | Owner changes.                                   |
| whatsapp.automation.paused       | Human takeover enabled.                          |
| whatsapp.outbound.queued         | Message persisted in outbox.                     |
| whatsapp.outbound.sent           | Meta accepts outbound message.                   |
| whatsapp.outbound.status_changed | Delivered/read/failed status received.           |
| whatsapp.follow_up.created       | Next action created.                             |
| whatsapp.opt_out.recorded        | Contact opts out.                                |
| whatsapp.webhook.failed          | Invalid/unprocessable/retryable webhook failure. |

# **Appendix C. Future-ready but not V1**

Keep the following extension points in the schema and service interfaces, but do not build the user experience until V1 usage validates the need.

- Multiple business workspaces and a separate WABA/phone number mapping per workspace.

- Embedded Signup so future agencies/developers connect their own Meta assets without sharing credentials.

- Versioned visual automation builder with conditions, delay nodes, webhooks and A/B testing.

- AI intent assistant and knowledge retrieval with strict project-source citations and human review guardrails.

- Campaign broadcast, payment/billing, omnichannel inbox and external CRM integrations.

> **Build quality bar**
> The system is ready for internal launch only when PropertyGo agents can work a real ad enquiry end-to-end without WhatsApp Web, personal phones, spreadsheets, hidden credentials or manual forwarding—and every customer-facing action is traceable in PropertyGo.
