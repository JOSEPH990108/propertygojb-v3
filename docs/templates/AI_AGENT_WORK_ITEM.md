# AI Agent Work Item

Use this template before any agent implements a PropertyGoJB change. Replace every placeholder; use `Not applicable—<reason>` rather than leaving risk fields blank.

## Identity and ownership

- **Work item ID:**
- **Title:**
- **Status:** DRAFT / READY / APPROVED / IMPLEMENTED / VERIFIED / RELEASED / BLOCKED / CANCELLED
- **Human owner:**
- **Requested by:**
- **Sanitized original request:**
- **Target date:**
- **Risk class:** R0 / R1 / R2 / R3 / R4
- **Autonomy ceiling:** A0 / A1 / A2 / A3 / A4
- **Required approvers:**

## Business outcome

- **Problem/opportunity:**
- **Expected user/business outcome:**
- **Affected personas/roles:** CUSTOMER / AGENT / ADMIN / SUPER_ADMIN / anonymous / system
- **Success measure:**

## Scope

### In scope

-

### Explicitly out of scope

-

## Requirements

| ID        | Requirement | Priority              | Source/owner |
| --------- | ----------- | --------------------- | ------------ |
| `REQ-001` |             | Must / Should / Could |              |

## Acceptance criteria

| ID       | Given | When | Then | Verification       |
| -------- | ----- | ---- | ---- | ------------------ |
| `AC-001` |       |      |      | Automated / Manual |

## Non-functional requirements

- **Security and authorization:**
- **Privacy/data minimization/retention:**
- **Accessibility:**
- **Performance/capacity:**
- **Reliability/idempotency/concurrency:**
- **Observability/audit:**
- **Compatibility:**

## Impact map

- **Product surfaces/routes:**
- **Source modules/components:**
- **APIs/contracts:**
- **Tables/migrations:**
- **Integrations/jobs:**
- **Roles/permissions/record ownership:**
- **Documentation/configuration:**

## Data classification

- **Data used:** Public / Internal / Confidential / Restricted
- **PII or uploaded documents involved:**
- **Synthetic fixture plan:**
- **Model-visible data:**
- **Approved AI tenant/provider and allowed data class:**
- **Training use / retention / deletion / residency / subprocessors reviewed:**
- **Redaction, tokenization, DLP, or secret-scan evidence:**
- **Data-use approver and AI service-register entry:**
- **Retention/deletion/cross-border implications:**
- **DPIA/legal review required:** Yes / No — reason

## Risk and controls

| Calculator pass | Request/file manifest | Score | Risk | Matched rule IDs | Decision/gate |
| --------------- | --------------------- | ----- | ---- | ---------------- | ------------- |
| Request-only    |                       |       |      |                  |               |
| Proposed files  |                       |       |      |                  |               |
| Final manifest  |                       |       |      |                  |               |

- **Failure modes and blast radius:**
- **Threat/abuse cases:**
- **Agent tools permitted:**
- **Prohibited actions:**
- **Human checkpoints:**
- **Residual risks requiring acceptance:**

## Delivery plan

- **Implementation approach:**
- **Alternatives/trade-offs:**
- **Agent/file ownership:**
- **Dependencies:**
- **Migration/data rehearsal:**
- **Rollout/staging:**
- **Rollback or forward-fix:**

## Verification plan

| Test ID    | Requirement/Invariant | Level                                        | Positive/negative/concurrent case | Expected evidence |
| ---------- | --------------------- | -------------------------------------------- | --------------------------------- | ----------------- |
| `TEST-001` | `REQ-001`             | Unit / Integration / E2E / Security / Manual |                                   |                   |

Record `Pass`, `Fail`, or `N/A—<reason>` for every check. The full clean-CI matrix is required for code, dependency, build/configuration, schema, and executable workflow changes. A docs-only change may mark unrelated application checks N/A, but must run formatting, link/reference validation, scope review, and its human gate. The accountable reviewer approves every N/A.

| Check                                                      | Planned environment                  | Required outcome / N/A reason |
| ---------------------------------------------------------- | ------------------------------------ | ----------------------------- |
| `git diff --check`                                         | Workspace / Clean CI                 |                               |
| Scope review against the declared file manifest            | Workspace / Clean CI                 |                               |
| `npm ci`                                                   | Clean CI                             |                               |
| `npm exec next typegen`                                    | Clean CI                             |                               |
| `npm exec prettier -- --check .`                           | Clean CI                             |                               |
| `npm run lint -- --max-warnings=0`                         | Clean CI                             |                               |
| `npm run typecheck`                                        | Clean CI                             |                               |
| `npm run test` and applicable coverage                     | Clean CI                             |                               |
| `npm run build`                                            | Clean CI                             |                               |
| `npm audit --audit-level=high`                             | Clean CI                             |                               |
| Risk-specific integration/E2E/accessibility/security tests | Clean CI / isolated test environment |                               |
| Migration rehearsal and recovery evidence                  | Isolated database                    |                               |
| Docs formatting and link/reference validation              | Workspace / Clean CI                 |                               |

## Questions and assumptions

| Item | Question or assumption | Owner | Due/decision |
| ---- | ---------------------- | ----- | ------------ |
| 1    |                        |       |              |

## Durable-rule candidates

Do not activate inferred rules automatically. Record the exact candidate, evidence, owner, and intended validation here; promotion to `learnedRules[].status: active` requires the R3 control-plane approval described in `docs/sdlc/SESSION_CONTEXT.md`.

| Candidate ID | Exact statement | Evidence/source | Owner | Proposed risk floor | Status/decision |
| ------------ | --------------- | --------------- | ----- | ------------------- | --------------- |
|              |                 |                 |       |                     |                 |

## Ready approval

- **Product owner:**
- **Technical/security/privacy approver(s):**
- **Approved scope/risk/autonomy:**
- **Approval evidence:**
- **Date:**
