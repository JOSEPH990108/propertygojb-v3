---
name: propertygojb-agentic-sdlc
description: Convert an informal PropertyGoJB feature, bug-fix, refactor, configuration, or documentation change request into a rule-aware work item and execute the governed Agentic SDLC. Use for any request that may modify repository files or application behavior; skip for ordinary read-only questions unless the user asks to formalize them.
---

# PropertyGoJB guarded auto-SDLC

The user may provide only a few sentences. Do not ask them to fill templates or name agents. Infer routine details from repository evidence, state assumptions, and execute as far as the risk gate permits.

## Load context cheaply

1. Read `AGENTS.md` and `docs/sdlc/SESSION_CONTEXT.md`.
2. Inspect `git status` and preserve unrelated/untracked work.
3. Run the request-only score:

   ```bash
   npm run sdlc:score -- --request "<sanitized original request>"
   ```

4. Investigate relevant current code and version-matched Next.js docs.
5. Re-run with proposed files:

   ```bash
   npm run sdlc:score -- --request "<request>" --files "path/a.ts,path/b.ts"
   ```

6. Read the full entries for every matched rule ID in `docs/sdlc/business-rules.json`. Read `docs/AI_AGENTIC_SDLC.md` when the result is R2+, the change touches a protected domain, or a gate is unclear.

Never include secrets, OTPs, raw customer data, documents, conversations, or real environment values in the request passed to the calculator or in agent context.

## Turn intent into a Ready work item

For an R1–R3 requested repository mutation, create a collision-resistant `docs/work-items/PG-YYYYMMDD-HHMMSS-XXXXXXXX-short-slug.md` as specified in `docs/work-items/README.md`, using `docs/templates/AI_AGENT_WORK_ITEM.md`. R0 does not need a work item, and an R4 request receives a human-run plan in chat without a repository write. Populate an applicable work item automatically with:

- sanitized original request and human owner;
- `REQ-*`, `AC-*`, non-goals, and explicit assumptions;
- affected users, roles, surfaces, routes, tables, integrations, and data class;
- both calculator runs, matched business rules, risk class, autonomy, gates, and checks;
- security/privacy/accessibility/performance/concurrency concerns;
- proposed file ownership, tests, rollout, and rollback;
- any candidate durable business rule.

Ask a question only when an unresolved choice would materially change business behavior, data handling, authorization, external effects, or risk. Batch necessary questions.

## Apply guarded autonomy

| Risk | Default action                                                                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R0   | For read-only work, answer with evidence. Do not create a work item unless the user asks to formalize the analysis.                                                        |
| R1   | Plan, implement in the workspace, test, and independently self-challenge. Do not merge or deploy.                                                                          |
| R2   | Record the plan and standing guarded-auto approval, then implement if reversible, bounded, non-protected, and free of unresolved material choices. Do not merge or deploy. |
| R3   | Finish investigation, requirements, design, test/rollback plan, and work item; stop before implementation/source/control edits and request explicit human approval.        |
| R4   | Advice and human-run plan in chat only. Do not write repository files, perform the restricted action, or create a disguised lower-risk substitute.                         |

Always raise the class when code evidence, proposed paths, or side effects reveal more risk. Never lower a calculator result on your own. A failing check, unexpected scope, dirty-file collision, or new protected path stops implementation until resolved.

## Execute after the gate

- Use the smallest conforming change and non-overlapping file ownership.
- Re-check validation, authentication, role, and ownership at mutation boundaries.
- Preserve business state, transaction, idempotency, consent, privacy, and audit invariants from matched rules.
- Add tests from the acceptance criteria, including denial, failure, concurrency, and rollback cases where relevant.
- Use an implementation pass and a logically independent review pass; an agent does not approve its own work.
- Run every calculator-listed check and record `Pass`, `Fail`, or `N/A—reason`.
- Re-score the final changed-file manifest. If risk increases, apply the higher gate before further work.

## Close with evidence and memory

Complete `docs/templates/AI_CHANGE_EVIDENCE.md` in the work item or PR evidence. Report requirements covered, changed files, checks, matched rules, residual risk, and rollback.

If a durable rule was established, keep it as a candidate until a human approves promotion. On approval, add it to `learnedRules` with a stable `BR-LEARN-*` ID, `status: active`, category, enforcement status, evidence, owner, approver and approval date, review date, risk floor, paths/keywords, required controls, and validation expectations. Run `npm run sdlc:validate` and `npm run test:sdlc` after any registry change.
