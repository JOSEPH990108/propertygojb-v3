# PG-20260901-001 - Automatic Agentic SDLC and business-rule memory

## Identity and ownership

- **Status:** IMPLEMENTED
- **Human owner:** PropertyGoJB owner
- **Requested by:** Repository owner
- **Sanitized original request:** Let me describe a change in a few sentences, then have AI automatically run the SDLC with a weightage calculator and persistent business-rule memory for every Copilot session.
- **Target date:** 2026-09-01
- **Risk class:** R3 (protected agent control plane)
- **Autonomy ceiling:** A2
- **Required approvers:** Repository owner

## Business outcome

- **Problem/opportunity:** Informal requests currently depend on each coding session remembering and manually applying the full SDLC and project rules.
- **Expected outcome:** A short request automatically enters a repeatable intake, investigation, scoring, work-item, implementation, verification, and evidence workflow up to its human gate.
- **Affected roles:** Repository owner, developers, reviewers, and coding agents.
- **Success measure:** A fresh Copilot/agent session can discover the workflow, classify representative requests deterministically, load relevant rules, and reject restricted actions.

## Scope

### In scope

- Always-on repository instructions, an auto-selected Agentic SDLC skill, a reusable prompt, and protected-path guidance.
- Version-controlled session context and a structured business-rule registry with learning governance.
- A deterministic CLI weightage calculator, registry validation, and regression tests.
- Work-item/evidence templates and usage documentation.

### Explicitly out of scope

- Merging, deployment, production access, external messages, secrets, or real customer data.
- A runtime customer-facing AI system, hosted orchestration service, or CI/branch-protection setup.
- Changes to the user's in-progress WhatsApp implementation.

### Declared and final file manifest

The proposed and final manifests are identical. These are the only 17 paths owned by this work item:

1. `AGENTS.md`
2. `README.md`
3. `package.json`
4. `.github/copilot-instructions.md`
5. `.github/instructions/protected-domains.instructions.md`
6. `.github/prompts/sdlc.prompt.md`
7. `.github/skills/propertygojb-agentic-sdlc/SKILL.md`
8. `docs/AI_AGENTIC_SDLC.md`
9. `docs/sdlc/SESSION_CONTEXT.md`
10. `docs/sdlc/business-rules.json`
11. `docs/sdlc/business-rules.schema.json`
12. `docs/templates/AI_AGENT_WORK_ITEM.md`
13. `docs/templates/AI_CHANGE_EVIDENCE.md`
14. `docs/work-items/README.md`
15. `docs/work-items/PG-20260901-001-agentic-sdlc-automation.md`
16. `scripts/sdlc-score.mjs`
17. `scripts/sdlc-score.test.mjs`

The untracked WhatsApp specification and implementation paths are explicitly excluded and preserved.

## Requirements and acceptance criteria

| ID      | Requirement                                                                                     | Acceptance criterion                                                                                                                         |
| ------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| REQ-001 | Accept a few informal sentences as SDLC intake.                                                 | AC-001: repository instructions route mutating requests into the skill without requiring a form.                                             |
| REQ-002 | Calculate conservative, monotonic risk from intent, rules, exact paths, and bounded escalators. | AC-002: unknown mutations are at least R2; protected changes are R3; only explicit hard stops become R4.                                     |
| REQ-003 | Preserve project business knowledge across sessions.                                            | AC-003: stable rules include sources, enforcement status, controls, and validation expectations in committed files.                          |
| REQ-004 | Prevent memory poisoning.                                                                       | AC-004: proposed learned rules do not affect scoring; activation requires human-approved governance fields.                                  |
| REQ-005 | Enforce risk-dependent autonomy.                                                                | AC-005: R3 may write planning evidence but stops before implementation edits without approval; R4 never executes; final files are re-scored. |
| REQ-006 | Make the control plane testable and usable.                                                     | AC-006: registry validation, calculator tests, CLI help, digest, JSON, request, file, and changed-worktree modes work locally.               |

## Impact and data classification

- **Surfaces/files:** `AGENTS.md`, `.github/`, `docs/`, `scripts/sdlc-score*.mjs`, `package.json`, and `README.md`.
- **Application APIs/tables/integrations:** No runtime application or database behavior changes.
- **Data class:** Internal repository metadata only.
- **PII/documents/model-visible data:** None; examples are synthetic and sanitized.
- **Security/privacy:** The workflow prohibits secret/PII/document access and distinguishes implementation work from real external actions.

## Risk and controls

| Calculator pass | Request/file manifest           | Score | Risk | Matched rule IDs      | Decision/gate                                      |
| --------------- | ------------------------------- | ----- | ---- | --------------------- | -------------------------------------------------- |
| Request-only    | Informal request                | 30    | R2   | None                  | Conservative guarded-auto intake                   |
| Proposed files  | Declared 17-path manifest above | 75    | R3   | BR-CTRL-001, ESC-WIDE | Owner approval required before control-plane edits |
| Final manifest  | Declared 17-path manifest above | 75    | R3   | BR-CTRL-001, ESC-WIDE | Approved scope retained; no R4 action              |

- **Failure modes:** False-low classification, keyword score inflation, ordinary questions triggering high risk, silently activated rules, stale session context, or instructions that agents cannot discover.
- **Blast radius:** Future coding-agent decisions across the repository.
- **Tools permitted:** Local repository reads, scoped edits, formatting, validation, and tests.
- **Prohibited actions:** Secret/production data access, deployment, external delivery, privilege grants, destructive operations, or changes outside the declared scope.
- **Rollback:** Revert only this declared file set to its prior revisions; no schema or production rollback is involved.

## Delivery and verification plan

1. Add concise always-on instructions, durable session context, and the auto-SDLC skill.
2. Extract code-backed rules while labeling current enforcement accurately.
3. Implement maximum-weight plus risk-floor scoring, bounded escalators, and explicit hard stops.
4. Test R0 through R4, unknown work, repeated keywords, environment-file exclusions, and learned-rule lifecycle.
5. Format, validate links/references, run project tests, re-score the final manifest, and independently review the diff.

| Test ID  | Invariant                                                          | Level         | Expected evidence                                  |
| -------- | ------------------------------------------------------------------ | ------------- | -------------------------------------------------- |
| TEST-001 | Registry structure and governance are valid.                       | Unit/CLI      | `npm run sdlc:validate` passes.                    |
| TEST-002 | Risk classes cannot be bypassed or inflated into R4 by repetition. | Unit          | `npm run test:sdlc` passes all cases.              |
| TEST-003 | Existing application behavior is unchanged.                        | Regression    | Existing Vitest suite passes.                      |
| TEST-004 | Instructions and local skill are discoverable and well formed.     | Static/manual | Skill validator, formatting, and link checks pass. |

### Verification results

Final metadata and scope validation: 4 September 2026. Application test/build results were last rerun on 3 September 2026.

| Check                                            | Result                                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run sdlc:validate`                          | Pass: 44 base rules; no active/proposed learned rules.                                                                                     |
| `npm run test:sdlc`                              | Pass: 33/33 calculator tests.                                                                                                              |
| `npm run test`                                   | Pass: 90/90 tests across 17 files.                                                                                                         |
| `npm exec next typegen`                          | Pass.                                                                                                                                      |
| `npm run typecheck`                              | Pass.                                                                                                                                      |
| `npm run build`                                  | Pass: production build and 101 static pages generated.                                                                                     |
| Scoped Prettier check                            | Pass.                                                                                                                                      |
| `npm exec prettier -- --check .`                 | Fail: 288 existing/out-of-scope files require formatting; declared work-item files pass the scoped check.                                  |
| Markdown relative-link and rule-reference checks | Pass.                                                                                                                                      |
| Skill quick validator                            | Pass.                                                                                                                                      |
| `git diff --check`                               | Pass.                                                                                                                                      |
| Scope review against the declared manifest       | Pass: all 17 owned paths are declared; separate unowned WhatsApp, stage-0, CI, and CODEOWNERS work remains excluded and preserved.         |
| `npm run lint -- --max-warnings=0`               | Fail: pre-existing `prefer-const` at `src/components/public/public-landed-availability.tsx:223`; file is outside this work item.           |
| `npm audit --audit-level=high`                   | Fail: existing graph reports 10 high and 5 moderate advisories; remediation is out of scope and must not use an unreviewed forced upgrade. |
| `npm ci` in clean CI                             | N/A: no clean CI environment is configured; current installed tree was preserved.                                                          |

### Independent-review disposition

Separate read-only reviewer sessions (`final_review`, `adversarial_scoring`, and `final_recheck`, 1–3 September 2026) challenged the implementation. Their findings led to fixes for false-low execution questions, mixed harmless/dangerous wording, action/target false positives, sentence/connective bypasses, secret/customer-data disclosure paraphrases, source-control actions, protected-path omissions, absolute/traversal/NTFS-stream paths, Git filename quoting, CLI option parsing, mutable risk/gate/check/autonomy policy, learned-memory container/date poisoning, obsolete prompt metadata, ambiguous R3/R4 planning edits, race-prone work-item names, and the missing exact manifest. Regression tests cover these calculator safety cases; human acceptance and clean-CI evidence remain outstanding.

This work item remains `IMPLEMENTED`, not `VERIFIED`: the pre-existing lint failure, dependency advisories, and unavailable clean-checkout CI evidence have not been accepted as exceptions. They block a verified/release-ready claim, not the local implementation record. No merge or deployment is authorized.

## Questions, assumptions, and durable-rule candidates

- **Assumption:** "Each session of Copilot" means durable, repository-committed instructions and skills, because preview Copilot Memory is not available to every VS Code Chat session.
- **Assumption:** The owner's "Yes, this is what I want" followed by "please continue" is explicit approval for this described control-plane implementation; it does not authorize merge, deployment, or production action.
- **Open material questions:** None.
- **Durable-rule candidates:** None. Future candidate rules use the governed `proposed` to `active` lifecycle.

## Ready approval

- **Product/technical approver:** Repository owner
- **Approved scope/risk/autonomy:** R3/A2 repository implementation only
- **Approval evidence:** User messages "Yes, this is what I want" and "please continue" in this task thread.
- **Date:** 2026-09-01
