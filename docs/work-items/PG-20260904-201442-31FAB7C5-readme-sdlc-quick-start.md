# README Agentic SDLC Quick Start

## Identity and ownership

- **Work item ID:** PG-20260904-201442-31FAB7C5
- **Title:** Add a quick Agentic SDLC README instruction
- **Status:** IMPLEMENTED
- **Human owner:** Repository owner
- **Requested by:** Repository owner
- **Sanitized original request:** Help me add a quick README instruction for the Agentic SDLC.
- **Target date:** 4 September 2026
- **Risk class:** R2
- **Autonomy ceiling:** A2 guarded-auto
- **Required approvers:** Repository owner

## Business outcome

Make the normal Agentic SDLC entry point obvious to a contributor who only reads the root README.

## Scope

### In scope

- Replace the existing detailed AI-assisted-development introduction with a short numbered quick start.
- Retain the calculator commands and links to the complete guide and rule memory.
- Record this documentation-only work item.

### Explicitly out of scope

- Application behavior, source code, dependencies, configuration, policies, business rules, CI, merge, and deployment.

## Requirements and acceptance criteria

| ID        | Requirement                                                                  | Acceptance criterion                                                                       |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `REQ-001` | Explain how to start from a few informal sentences in Copilot Agent mode.    | `AC-001`: README contains short numbered steps and one copy-paste request example.         |
| `REQ-002` | Explain risk-gated execution and the human approval point without ambiguity. | `AC-002`: README distinguishes automatic R0-R2 handling, R3 approval, and R4 human action. |
| `REQ-003` | Preserve access to manual commands and detailed documentation.               | `AC-003`: Existing calculator commands and relevant local links remain available.          |

## Impact and data classification

- **Documentation/configuration:** `README.md` and this work item only.
- **Affected personas:** Contributors using Copilot Agent mode.
- **Data used:** Public/internal project documentation only.
- **PII, uploaded documents, secrets, or production data:** None.
- **Security, privacy, accessibility, performance, reliability:** No runtime effect.

## Risk and controls

| Calculator pass | Request/file manifest                | Score | Risk | Matched rules | Decision/gate                                       |
| --------------- | ------------------------------------ | ----- | ---- | ------------- | --------------------------------------------------- |
| Request-only    | Sanitized README instruction request | 30    | R2   | None          | Recorded guarded-auto plan                          |
| Proposed files  | `README.md`, this work item          | 30    | R2   | None          | Bounded reversible documentation change may proceed |
| Final manifest  | `README.md`, this work item          | 30    | R2   | None          | Scope and documentation checks passed               |

- **Failure modes:** Confusing instructions, broken local links, or accidental policy changes.
- **Permitted tools:** Read-only inspection, `apply_patch`, scoped formatting, link checks, calculator, and Git diff checks.
- **Prohibited actions:** Application edits, rule changes, merge, deployment, and modification of unrelated work.
- **Rollback:** Revert the README section and remove this work item before merge.

## Delivery and verification plan

1. Restructure only the existing README Agentic SDLC section into a numbered quick start.
2. Preserve the manual commands and authoritative-document links.
3. Re-score the final two-file manifest.
4. Run scoped Prettier, relative-link validation, `git diff --check`, and scope review.
5. Mark application build/test checks `N/A` because this is a non-executable documentation-only change.

## Verification results

| Check                                   | Result                                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Final risk score                        | Pass: 30, R2, two-file documentation manifest.                                           |
| Scoped Prettier                         | Pass.                                                                                    |
| Relative Markdown links                 | Pass.                                                                                    |
| `git diff --check`                      | Pass.                                                                                    |
| Scope and policy review                 | Pass: only the declared README and work-item files were changed for this request.        |
| Application typecheck, tests, and build | N/A: wording-only documentation change with no executable or configuration modification. |

Review confirmed that the quick start summarizes the existing R0-R4 gates without weakening or changing policy. Human review is still required before merge; no merge or deployment was performed.

## Durable-rule candidates

None. This change explains existing policy and does not create or amend a business rule.

## Ready approval

- **Product owner:** Repository owner
- **Approved scope/risk/autonomy:** R2 guarded-auto, documentation-only two-file scope
- **Approval evidence:** User requested the README instruction and asked the agent to implement it; standing guarded-auto policy applies.
- **Date:** 4 September 2026
