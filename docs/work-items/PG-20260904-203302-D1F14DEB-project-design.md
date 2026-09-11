# AI Agent Work Item

## Identity and ownership

- **Work item ID:** PG-20260904-203302-D1F14DEB
- **Title:** Research and document the PropertyGoJB system design
- **Status:** IMPLEMENTED
- **Human owner:** PropertyGoJB product/engineering owner
- **Requested by:** Repository user
- **Sanitized original request:** Research the repository architecture and prepare a project `DESIGN.md` document.
- **Target date:** 4 September 2026
- **Risk class:** R2 (retained from the request-only score; exact documentation scope scored R1)
- **Autonomy ceiling:** A2
- **Required approvers:** PropertyGoJB product/engineering owner; independent reviewer for factual and scope review

## Business outcome

- **Problem/opportunity:** The repository has detailed feature, QA, and SDLC documentation but no single current-state system-design entry point for maintainers.
- **Expected user/business outcome:** Maintainers can understand the system boundary, architecture, data model, critical runtime flows, controls, integrations, deployment assumptions, and known gaps without reconstructing them from the entire codebase.
- **Affected personas/roles:** Product/engineering owner, developers, reviewers, operators, and coding agents. Application users and runtime roles are not behaviorally affected.
- **Success measure:** A root `DESIGN.md` accurately describes the current repository, distinguishes implemented behavior from target direction, links evidence, and passes scoped documentation checks.

## Scope

### In scope

- Add a root `DESIGN.md` as the living architecture overview.
- Cover goals, constraints, system context, building blocks, data domains, representative runtime flows, cross-cutting controls, integrations, deployment view, quality strategy, risks, and maintenance rules.
- Use compact Mermaid diagrams where they make relationships or workflows easier to understand.
- Ground claims in current source, migrations, tests, active business rules, version-matched Next.js 16.2.9 documentation, and primary architecture-documentation references.
- Record this governed work item and verification evidence.

### Explicitly out of scope

- Application code, schema, migration, dependency, configuration, or behavior changes.
- Creating or changing business rules, SDLC policy, permissions, deployment infrastructure, or production state.
- Claiming unfinished or planned controls are already enforced.
- Reading secrets, environment values, customer data, uploaded documents, or raw conversations.

## Requirements

| ID        | Requirement                                                                                                                                | Priority | Source/owner                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------- |
| `REQ-001` | Add a concise but sufficient current-state design document at repository root.                                                             | Must     | User                                |
| `REQ-002` | Describe the system context, architecture boundaries, code organization, data domains, and external integrations from repository evidence. | Must     | User/repository                     |
| `REQ-003` | Explain representative public, CRM, booking, document, publication, and WhatsApp runtime flows.                                            | Must     | Repository                          |
| `REQ-004` | Make authorization, ownership, audit, consent, data classification, state, idempotency, and concurrency invariants visible.                | Must     | Active business-rule registry       |
| `REQ-005` | Clearly separate current implementation, known gaps, and target direction.                                                                 | Must     | Session context                     |
| `REQ-006` | Link authoritative local evidence and primary external references, and define how the document stays current.                              | Should   | Architecture-documentation research |

## Acceptance criteria

| ID       | Given                                                                 | When                                   | Then                                                                                             | Verification                |
| -------- | --------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------- |
| `AC-001` | A maintainer opens the repository                                     | They read `DESIGN.md`                  | They can identify the product surfaces, system boundary, major building blocks, and dependencies | Manual                      |
| `AC-002` | A maintainer investigates a critical flow                             | They use the runtime and data sections | They can trace the flow to the relevant routes, libraries, schemas, and controls                 | Manual link/evidence review |
| `AC-003` | A statement concerns an incomplete control                            | It appears in `DESIGN.md`              | It is labelled as a current limitation or target direction, not an implemented guarantee         | Manual scope/factual review |
| `AC-004` | The documentation files are complete                                  | Scoped checks run                      | Markdown formatting, local references, diff hygiene, and declared scope pass                     | Automated/manual            |
| `AC-005` | The existing dirty worktree contains unrelated SDLC and WhatsApp work | This change is applied                 | No existing tracked or untracked file is modified, removed, moved, or overwritten                | Git scope review            |

## Non-functional requirements

- **Security and authorization:** Documentation must preserve the active boundary rules and must not reveal secrets or imply that layout guards replace mutation-boundary authorization.
- **Privacy/data minimization/retention:** Use schema and synthetic domain descriptions only; no runtime records, PII values, document contents, or raw messages.
- **Accessibility:** Mermaid diagrams must be accompanied by explanatory text or tables so the content remains understandable without rendered graphics.
- **Performance/capacity:** Not applicable—documentation-only; document current known capacity and observability limits without inventing targets.
- **Reliability/idempotency/concurrency:** Capture current invariants and known gaps, especially lead claims, bookings, imports, expiry, and webhook deduplication.
- **Observability/audit:** Distinguish operational audit, auth/document access records, marketing analytics, and missing runtime telemetry.
- **Compatibility:** Standard GitHub-flavored Markdown and Mermaid; no generated tooling or dependency changes.

## Impact map

- **Product surfaces/routes:** Documentation describes public/customer, agent, admin, auth, internal API, and webhook surfaces; runtime behavior unchanged.
- **Source modules/components:** Read-only evidence from `src/app`, `src/components`, `src/lib`, `src/config`, and `src/db`.
- **APIs/contracts:** Read-only documentation of 52 current route-handler files and their boundary patterns.
- **Tables/migrations:** Read-only documentation of Drizzle schemas and migrations; no database access or mutation.
- **Integrations/jobs:** Better Auth/Google identity, PostgreSQL, Ably, Nominatim/OpenStreetMap, marketing providers, local document storage, and in-progress WhatsApp Cloud API ingestion.
- **Roles/permissions/record ownership:** CUSTOMER, AGENT, ADMIN, and SUPER_ADMIN boundaries are documented; no policy change.
- **Documentation/configuration:** New `DESIGN.md` and this work item only.

## Data classification

- **Data used:** Internal repository source and public framework/architecture documentation.
- **PII or uploaded documents involved:** No.
- **Synthetic fixture plan:** Not applicable; no data fixtures are needed.
- **Model-visible data:** Repository source and docs already placed in scope by the user; no environment values or runtime records.
- **Approved AI tenant/provider and allowed data class:** Current coding-agent session; Internal repository content only.
- **Training use / retention / deletion / residency / subprocessors reviewed:** Governed outside this work item by the repository AI-service policy; no expanded data use requested.
- **Redaction, tokenization, DLP, or secret-scan evidence:** Secret-bearing `.env.local` was identified by filename only and not opened; no customer/runtime data was accessed.
- **Data-use approver and AI service-register entry:** PropertyGoJB product/engineering owner; existing session authorization.
- **Retention/deletion/cross-border implications:** No new runtime data or processor.
- **DPIA/legal review required:** No—documentation-only and no personal data processing change.

## Risk and controls

| Calculator pass | Request/file manifest                                                      | Score | Risk | Matched rule IDs | Decision/gate                                                                            |
| --------------- | -------------------------------------------------------------------------- | ----- | ---- | ---------------- | ---------------------------------------------------------------------------------------- |
| Request-only    | Research the repository architecture and prepare a project design document | 30    | R2   | None             | Retain R2; recorded guarded-auto plan, docs-only scoped checks, independent review       |
| Proposed files  | `DESIGN.md`, this work item                                                | 15    | R1   | None             | Do not lower governing R2; bounded reversible docs-only implementation may proceed at A2 |
| Final manifest  | `DESIGN.md`, this work item                                                | 15    | R1   | None             | Governing R2 retained; scoped docs checks passed                                         |

- **Failure modes and blast radius:** Stale, inaccurate, overly detailed, or aspirational documentation could mislead maintainers. Blast radius is repository understanding only; rollback is deletion/reversion of the two new files.
- **Threat/abuse cases:** Accidental secret/PII inclusion; treating planned controls as current; hidden policy changes; misleading authorization or deployment claims.
- **Agent tools permitted:** Read-only repository inspection, primary-source web research, workspace-only Markdown edits, and scoped validation commands.
- **Prohibited actions:** Reading secret-bearing environment files or runtime records; editing application/control-plane files; database access; external messages; merge/deploy.
- **Human checkpoints:** Owner reviews factual accuracy and accepts the deliverable; a separate reviewer should validate the latest diff before merge.
- **Residual risks requiring acceptance:** Architecture documentation will drift unless changed with architecturally significant code and reviewed periodically.

## Delivery plan

- **Implementation approach:** Adapt the lean arc42 section set and C4 context/container views to the repository; prefer current-source evidence, then active rule memory, installed Next.js docs, and primary external references.
- **Alternatives/trade-offs:** A full generated inventory would become noisy and stale; the document instead provides stable abstractions, representative flows, and an evidence index. Separate ADRs are recommended only for future significant decisions.
- **Agent/file ownership:** This task owns only `DESIGN.md` and this work-item file.
- **Dependencies:** None.
- **Migration/data rehearsal:** Not applicable—no data or schema change.
- **Rollout/staging:** Documentation is reviewable directly in the repository; no preview deployment is needed.
- **Rollback or forward-fix:** Revert the two new Markdown files, or correct factual sections in a follow-up documentation change.

## Verification plan

| Test ID    | Requirement/Invariant               | Level                     | Positive/negative/concurrent case                                            | Expected evidence          |
| ---------- | ----------------------------------- | ------------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| `TEST-001` | `REQ-001`–`REQ-006`                 | Manual review             | Positive: every required design section exists and cites evidence            | Section/evidence checklist |
| `TEST-002` | `AC-004`                            | Documentation tooling     | Positive: changed Markdown passes Prettier                                   | Command exit 0             |
| `TEST-003` | `AC-004`                            | Link/reference validation | Negative: no missing repository-relative targets                             | Validation script/output   |
| `TEST-004` | `AC-005`                            | Scope review              | Negative: only declared files are added by this task                         | Git diff/status evidence   |
| `TEST-005` | No hidden policy or behavior change | Independent review        | Negative: prose describes rather than modifies authority or runtime behavior | Reviewer findings/verdict  |

Record `Pass`, `Fail`, or `N/A—<reason>` for every check.

| Check                                                      | Planned environment                  | Required outcome / N/A reason                                                               |
| ---------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `git diff --check`                                         | Workspace                            | Pass                                                                                        |
| Scope review against the declared file manifest            | Workspace                            | Pass                                                                                        |
| `npm ci`                                                   | Clean CI                             | N/A—docs-only; no dependency or lockfile change                                             |
| `npm exec next typegen`                                    | Clean CI                             | N/A—no route or framework behavior change                                                   |
| `npm exec prettier -- --check .`                           | Clean CI                             | N/A—full-repository baseline has known unrelated failures; run against the two changed docs |
| `npm run lint -- --max-warnings=0`                         | Clean CI                             | N/A—docs-only and known unrelated baseline failure                                          |
| `npm run typecheck`                                        | Clean CI                             | N/A—no TypeScript change                                                                    |
| `npm run test` and applicable coverage                     | Clean CI                             | N/A—no executable behavior change                                                           |
| `npm run build`                                            | Clean CI                             | N/A—no executable behavior change                                                           |
| `npm audit --audit-level=high`                             | Clean CI                             | N/A—no dependency change and known unrelated advisories                                     |
| Risk-specific integration/E2E/accessibility/security tests | Clean CI / isolated test environment | N/A—documentation-only                                                                      |
| Migration rehearsal and recovery evidence                  | Isolated database                    | N/A—no schema or data change                                                                |
| Docs formatting and link/reference validation              | Workspace                            | Pass                                                                                        |

## Questions and assumptions

| Item | Question or assumption                                                                                                                  | Owner                     | Due/decision                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------- |
| 1    | `DESIGN.md` at repository root is the desired discoverable entry point.                                                                 | Product/engineering owner | Assumed for this bounded change |
| 2    | The current dirty worktree, including untracked WhatsApp work, is relevant evidence but remains unrelated user-owned work.              | Product/engineering owner | Preserve unchanged              |
| 3    | The design should describe the repository snapshot as of 4 September 2026 and explicitly identify uncommitted/in-progress capabilities. | Product/engineering owner | Assumed for accuracy            |

## Durable-rule candidates

| Candidate ID   | Exact statement                                                      | Evidence/source | Owner                     | Proposed risk floor | Status/decision |
| -------------- | -------------------------------------------------------------------- | --------------- | ------------------------- | ------------------- | --------------- |
| Not applicable | No new durable business rule is proposed by this documentation task. | Not applicable  | Product/engineering owner | Not applicable      | None            |

## Ready approval

- **Product owner:** PropertyGoJB product/engineering owner
- **Technical/security/privacy approver(s):** Independent factual/scope reviewer before merge; no privacy approval required for this docs-only change
- **Approved scope/risk/autonomy:** Standing R2/A2 guarded-auto permission under repository instructions; two new Markdown files only
- **Approval evidence:** User requested preparation of the document; request-only and exact-file calculator results are recorded above
- **Date:** 4 September 2026

## Change evidence

- **Outcome:** Added a living, evidence-linked system-design entry point covering context, constraints, logical containers, repository boundaries, data domains, representative runtime flows, cross-cutting controls, deployment assumptions, quality strategy, decisions, risks, and maintenance.
- **Requirements covered:** `REQ-001`–`REQ-006`; the design contains all required sections, seven Mermaid diagrams, an evidence map, and explicit Current/Target/Gap language.
- **Changed files:** `DESIGN.md` and this work item only.
- **Calculator:** Final exact manifest scored 15/R1 with no matched rules. The governing class remains the original 30/R2; the implementation stayed within reversible documentation-only A2 scope.
- **Checks:**
  - Pass—Prettier check on both changed Markdown files.
  - Pass—whitespace/diff check on both new files using `git diff --no-index --check`.
  - Pass—all 46 repository-relative link targets used by `DESIGN.md` exist.
  - Pass—section/diagram/gap-label completeness check.
  - Pass—scope comparison against the initial dirty-worktree snapshot; this task added only its declared two files and preserved unrelated changes.
  - N/A—application install, type generation, lint, typecheck, tests, build, audit, integration/E2E, and migration checks because no executable, dependency, configuration, schema, or runtime behavior changed. Known baseline findings are documented in the design and session context.
- **Review:** A separate author challenge pass compared high-impact claims against route handlers, schemas, the active rule digest, installed Next.js 16.2.9 guidance, and current file counts. No independent approval is claimed; a human or separate reviewer must still review factual accuracy before merge.
- **Residual risk:** The architecture overview can drift as the system evolves, particularly the in-progress WhatsApp surface and production-readiness gaps. `DESIGN.md` includes explicit update triggers and quarterly review guidance.
- **Rollback:** Remove/revert the two new Markdown files; no runtime or data rollback is required.
