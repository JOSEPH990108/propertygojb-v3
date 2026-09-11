# PG-20260902-205700-A2C970B7 - Stage 0 enforcement baseline

## Identity and ownership

- **Status:** IMPLEMENTED
- **Human owner:** PropertyGoJB owner
- **Requested by:** Repository owner
- **Sanitized original request:** Continue the Agentic SDLC tasks by completing the next Stage 0 readiness work.
- **Target date:** 2026-09-02
- **Risk class:** R3 (protected control plane)
- **Autonomy ceiling:** A2 for planning; implementation requires explicit human approval
- **Required approvers:** `@JOSEPH990108` (repository owner and primary technical reviewer)

## Business outcome

- **Problem/opportunity:** The repository has a tested scorer and documented gates, but no technical CI, ownership, or evidence enforcement exists.
- **Expected outcome:** Every proposed agent-created change receives reproducible clean-checkout checks and control-plane changes require the right human review.
- **Affected roles:** Repository owner, developers, reviewers, coding agents, CI service.
- **Success measure:** A clean CI run validates the registry, scorer tests, application checks, dependency status, and evidence policy; ownership rules require human review for protected domains.

## Scope

### In scope

- Add a least-privilege GitHub Actions clean-checkout workflow.
- Add CODEOWNERS coverage for control-plane, auth, schema, booking, document, lead, payment, and WhatsApp paths.
- Add only the package scripts needed to run deterministic SDLC control checks in CI.
- Document required status checks and PR/work-item evidence expectations.
- Validate workflow permissions, action pinning policy, secret handling, and failure behavior.

### Explicitly out of scope

- Enabling branch protection or repository rulesets through the GitHub control plane.
- Merging, deployment, production access, secret creation/rotation, or changing existing application behavior.
- Automatically approving or merging agent-authored pull requests.
- Fixing dependency advisories or the application baseline outside CI wiring.

## Requirements

| ID      | Requirement                                                                                          | Priority | Source/owner                                   |
| ------- | ---------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| REQ-001 | CI must run from a clean checkout using the committed lockfile and pinned runtime assumptions.       | Must     | Stage 0 roadmap                                |
| REQ-002 | CI must run formatting, lint, typecheck, tests, build, audit, registry validation, and scorer tests. | Must     | AI Agentic SDLC                                |
| REQ-003 | Control-plane and protected domain files must require named human ownership review.                  | Must     | BR-CTRL-001 and protected-domains instructions |
| REQ-004 | CI must have read-only default permissions and must not expose production secrets or customer data.  | Must     | Security/privacy policy                        |
| REQ-005 | Evidence requirements must be documented without pretending branch protection is already enabled.    | Must     | Current readiness gap                          |

## Acceptance criteria

| ID     | Given                                                                           | When                            | Then                                                                                         | Verification     |
| ------ | ------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------- | ---------------- |
| AC-001 | A clean runner checks out the repository                                        | CI runs on a pull request       | It installs with `npm ci` and executes the declared deterministic checks                     | Automated        |
| AC-002 | The rule registry or scorer is malformed                                        | CI runs                         | The control check fails before the change can be considered verified                         | Automated        |
| AC-003 | A pull request changes auth, schema, booking, documents, or agent-control files | Review is requested             | CODEOWNERS identifies the repository owner and the appropriate technical reviewer            | Manual on GitHub |
| AC-004 | A workflow step fails                                                           | CI completes                    | The job is failed and no deploy, merge, secret mutation, or external customer message occurs | Automated/manual |
| AC-005 | The repository documents required checks                                        | A human configures branch rules | The required check names and the remaining manual settings are unambiguous                   | Manual           |

## Non-functional requirements

- **Security and authorization:** Workflow token is read-only by default; no production credentials; no arbitrary command input from issue/PR text.
- **Privacy/data minimization/retention:** Synthetic fixtures only; do not upload logs containing environment values or customer data.
- **Accessibility:** Not applicable to CI itself; application checks remain unchanged.
- **Performance/capacity:** Use dependency caching only if cache keys are lockfile-bound and do not weaken clean-install semantics.
- **Reliability/idempotency/concurrency:** CI must be safe to rerun and must not mutate production or shared databases.
- **Observability/audit:** Preserve CI logs and link the run to the PR/work item; redact secrets.
- **Compatibility:** Use the repository's Node/npm baseline and Next.js 16.2.9 guidance.

## Impact map

- **Product surfaces/routes:** None at runtime.
- **Source modules/components:** None expected.
- **APIs/contracts:** CI check names and PR evidence contract.
- **Tables/migrations:** None.
- **Integrations/jobs:** GitHub Actions only; no deployment job.
- **Roles/permissions/record ownership:** CODEOWNERS review ownership only; does not grant application roles.
- **Documentation/configuration:** `.github/workflows/ci.yml`, `.github/CODEOWNERS`, `package.json`, `README.md`, `docs/AI_AGENTIC_SDLC.md`, `docs/work-items/README.md`.

## Data classification

- **Data used:** Internal repository metadata and synthetic test data.
- **PII or uploaded documents involved:** None.
- **Synthetic fixture plan:** Existing tests only; no production export.
- **Model-visible data:** Source and test metadata required for implementation; no secrets or customer records.
- **Approved AI tenant/provider and allowed data class:** Coding-agent provider; internal repository metadata only.
- **Training use / retention / deletion / residency / subprocessors reviewed:** Not applicable to this repository change; human owner to confirm provider settings before CI logs contain sensitive metadata.
- **Redaction, tokenization, DLP, or secret-scan evidence:** Required in implementation evidence.
- **Data-use approver and AI service-register entry:** Repository owner; service-register entry required before expanding provider access.
- **Retention/deletion/cross-border implications:** GitHub Actions logs follow repository retention policy; no customer data permitted.
- **DPIA/legal review required:** No, because runtime behavior and personal data handling are unchanged.

## Risk and controls

- **Failure modes and blast radius:** False-green checks, excessive token permissions, accidental secret exposure, reviewer bypass, or misleading “protected” documentation.
- **Threat/abuse cases:** Malicious PR workflow modification, dependency compromise, untrusted PR code access to secrets, and CODEOWNERS misconfiguration.
- **Agent tools permitted:** Local file reads/edits after approval, local validation, and synthetic CI rehearsal.
- **Prohibited actions:** GitHub control-plane changes, branch protection changes, secret access, merge, deployment, and production mutation.
- **Human checkpoints:** Approve this plan; review workflow permissions/action versions; configure branch rules manually; independently review the final diff.
- **Residual risks requiring acceptance:** GitHub branch protection and CODEOWNERS enforcement remain disabled until a human configures repository settings.

## Delivery plan

- **Implementation approach:** Add one CI workflow with explicit read-only permissions and one CODEOWNERS file, then update the documented required-check list and package scripts only if necessary.
- **Alternatives/trade-offs:** A hosted orchestrator could enforce gates more strongly, but would add credentials and service risk; this item establishes the repository baseline first.
- **Agent/file ownership:** One implementation owner for `.github/**`; one reviewer for workflow permissions and protected paths; documentation changes owned by the implementation owner.
- **Dependencies:** GitHub Actions runner, ephemeral PostgreSQL 16 service, repository owner account, package lock, Node 22/npm 10 baseline.
- **Migration/data rehearsal:** CI applies the committed migrations to an ephemeral PostgreSQL 16 service; no production database is used.
- **Rollout/staging:** Validate in a pull request; configure required checks after the workflow succeeds.
- **Rollback or forward-fix:** Revert only the declared workflow/CODEOWNERS/docs/script changes; no runtime rollback required.

## Verification plan

| Test ID  | Requirement/Invariant | Level    | Positive/negative/concurrent case                                      | Expected evidence                            |
| -------- | --------------------- | -------- | ---------------------------------------------------------------------- | -------------------------------------------- |
| TEST-001 | REQ-001/002           | CI       | Clean checkout runs all required checks                                | Successful CI run                            |
| TEST-002 | REQ-002               | Unit/CLI | Invalid registry and scorer regression cases fail                      | `npm run sdlc:validate`, `npm run test:sdlc` |
| TEST-003 | REQ-003               | Manual   | CODEOWNERS paths match protected domains and owner teams               | Reviewer inspection                          |
| TEST-004 | REQ-004               | Security | Workflow has read-only permissions and no production secret references | Workflow review + secret scan                |
| TEST-005 | REQ-005               | Docs     | Required checks and manual branch settings are consistent              | Link/reference check                         |

## Calculator evidence

- **Request-only:** R2, score 30, autonomy A2.
- **Exact proposed files:** R3, score 60, autonomy A2; matched `BR-CTRL-001`; approval required before implementation.
- **Final manifest:** `.github/workflows/ci.yml`, `.github/CODEOWNERS`, and this work item, plus the previously declared control-plane files already in the worktree.
- **Required gates:** Human plan approval before implementation, applicable security/privacy review, integration or CI evidence, staging/PR evidence, rollback plan, independent review.
- **Required controls:** Human plan approval, control-plane tests, scope review, independent review.

## Implementation verification

- **Approval:** Explicit repository-owner approval recorded on 2026-09-02.
- **`npm run sdlc:validate`:** Pass; 44 base rules, no active/proposed learned rules.
- **`npm run test:sdlc`:** Pass; 23/23 tests.
- **Prettier:** Pass for the workflow and Markdown work item. CI checks supported file extensions in the PR/push diff only, avoiding unrelated baseline formatting debt; `CODEOWNERS` is intentionally excluded because Prettier has no parser for that format.
- **`git diff --check`:** Pass.
- **CODEOWNERS syntax:** Pass; 21 non-comment rules have a path/pattern and owner column.
- **Full application CI:** Not rerun in this control-plane increment; existing application baseline remains subject to the workflow's clean-checkout run with an ephemeral PostgreSQL 16 service.
- **Remaining human action:** Configure GitHub branch protection/rulesets to require the CI status check and CODEOWNERS review. This cannot be performed by the agent.

## Questions and assumptions

| Item | Question or assumption                                                                                                            | Owner            | Due/decision       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------ |
| 1    | Decision: `@JOSEPH990108` is the repository owner and primary technical reviewer; no separate security reviewer currently exists. | Repository owner | Decided 2026-09-02 |
| 2    | Decision: pin Node 22 and npm 10 in CI.                                                                                           | Repository owner | Decided 2026-09-02 |
| 3    | Decision: GitHub Actions is the intended CI provider.                                                                             | Repository owner | Decided 2026-09-02 |

## Ready approval

- **Product owner:** `@JOSEPH990108`
- **Technical/security approver(s):** `@JOSEPH990108` (primary technical reviewer)
- **Approved scope/risk/autonomy:** R3/A2, declared files and controls only
- **Approval evidence:** User selected “Approve and implement” on 2026-09-02 after confirming provider, runtime baseline, and reviewer identity.
- **Date:** 2026-09-02
