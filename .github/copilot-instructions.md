# PropertyGoJB repository instructions

A user may describe a desired change in only a few sentences. For any request that may modify repository files or application behavior, automatically use the `propertygojb-agentic-sdlc` skill. Do not ask the user to complete an SDLC template or select agents.

## Session bootstrap

1. Read `AGENTS.md` and `docs/sdlc/SESSION_CONTEXT.md`.
2. Inspect `git status`; preserve unrelated tracked and untracked work.
3. Run `npm run sdlc:score -- --request "<sanitized request>"` before any repository mutation.
4. Derive requirements, acceptance criteria, assumptions, and non-goals from the request.
5. Trace current behavior through UI, route, authorization/ownership guard, domain logic, database, audit, and integrations as applicable.
6. Re-score with the exact proposed files using `--files`, then load every matched rule from `docs/sdlc/business-rules.json`.
7. Create the next work item under `docs/work-items/` for an R1–R3 repository mutation. Read-only R0 work and restricted R4 requests do not write a work item; return R4 advice and a human-run plan in chat.

## Risk gates

- R0: answer read-only questions with evidence; do not create a work item unless the user asks to formalize the analysis.
- R1: plan, implement, test, and perform a logically independent review pass.
- R2: guarded-auto may proceed only when the work is bounded, reversible, outside protected domains, and has no unresolved material business choice.
- R3: planning/work-item edits are allowed; obtain explicit human approval before implementation/source/control edits.
- R4: stop at advice and a human-run plan in chat. Do not execute the restricted action or write repository files.

Re-score the final changed-file manifest. Code evidence, paths, and side effects may raise risk; an agent never lowers the class on its own. Do not merge, deploy, modify production, grant privileges, reveal secrets, send real customer messages, or approve your own work.

## Durable business memory

`docs/sdlc/business-rules.json` is canonical machine-readable memory; `docs/sdlc/SESSION_CONTEXT.md` is the short human-readable map. Distinguish `enforced`, `partial`, `planned`, and `policy` rules.

Only base rules and learned rules with `status: active` affect work. Record a newly stated durable rule as a candidate in the work item. Never silently activate an inference. Promotion is an R3 control-plane change requiring human approval, source evidence, ownership, review date, and validation.

## Non-negotiable handling

- Use synthetic or redacted data only. Never place PII, OTPs, credentials, customer documents, or raw conversations in prompts, fixtures, logs, or evidence.
- Re-authorize authentication, role, and record ownership at every protected mutation boundary.
- Preserve atomicity, idempotency, state transitions, consent, audit, and rollback invariants from matched rules.
- Read the relevant local guide under `node_modules/next/dist/docs/` before changing Next.js behavior.
- Derive tests from acceptance criteria, including denial, failure, replay, and concurrency cases where applicable. Never weaken a control merely to make a check pass.

Useful commands: `npm run sdlc:rules`, `npm run sdlc:validate`, `npm run test:sdlc`. The full governance standard is `docs/AI_AGENTIC_SDLC.md`.

## UI generation

For UI creation or changes, read `docs/UI_DESIGN_GUIDE.md` before editing.
Inspect the closest existing screen, its shell, `src/app/globals.css`, and relevant
shared components. Reuse actual component APIs and semantic theme tokens.
Cover responsive layouts, keyboard/focus behavior, labels/errors, both themes,
reduced motion, and applicable loading/empty/error/pending/success states.
Preserve domain rules and report verification evidence and unverified cases.
This guide supplements the SDLC and does not change its approval gates.
