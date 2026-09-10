# AI-Assisted Change Evidence

Attach this evidence to the pull request or release record. Do not include secrets, customer PII, raw production records, OTPs, session data, or hidden chain-of-thought.

## Change summary

- **Work item / requirements:**
- **Business outcome:**
- **Request-only / proposed-file / final risk scores:**
- **Final risk class and autonomy level:**
- **Matched business-rule IDs and enforcement status:**
- **Human owner and approvers:**
- **Source commit / target branch:**
- **AI roles used:**
- **Model/provider/version (when available):**

## Scope and provenance

- **Changed files:**
- **Unrelated pre-existing changes preserved:**
- **Instructions and primary sources consulted:**
- **Key assumptions/decisions:**
- **Generated or third-party code/dependencies:**
- **Tool/network/database access used:**
- **Actual model-visible data and data class(es):**
- **Actual AI tenant/provider/model and service-register entry:**
- **Training use / retention / deletion / residency settings applied:**
- **Redaction, DLP, and secret-scan result:**
- **Deviation from planned data/provider handling and approval:**

## Traceability

| Requirement | Code/design | Test/evidence | Result               |
| ----------- | ----------- | ------------- | -------------------- |
| `REQ-001`   |             | `TEST-001`    | Pass / Fail / Manual |

## Verification commands

Record `Pass`, `Fail`, or `N/A—<reason>` for every row. The accountable reviewer approves every N/A; the implementation agent cannot waive a check by itself.

| Command/check                                              | Environment           | Pass / Fail / N/A—reason | Evidence link/summary |
| ---------------------------------------------------------- | --------------------- | ------------------------ | --------------------- |
| `git diff --check`                                         | Workspace / Clean CI  |                          |                       |
| Scope review against the declared file manifest            | Workspace / Clean CI  |                          |                       |
| `npm ci`                                                   | Clean CI              |                          |                       |
| `npm exec next typegen`                                    | Clean CI              |                          |                       |
| `npm exec prettier -- --check .`                           | Clean CI              |                          |                       |
| `npm run lint -- --max-warnings=0`                         | Clean CI              |                          |                       |
| `npm run typecheck`                                        | Clean CI              |                          |                       |
| `npm run test` and applicable coverage                     | Clean CI              |                          |                       |
| `npm run build`                                            | Clean CI              |                          |                       |
| `npm audit --audit-level=high`                             | Clean CI              |                          |                       |
| Risk-specific integration/E2E/accessibility/security tests | Isolated test/preview |                          |                       |
| Migration rehearsal and recovery evidence                  | Isolated database     |                          |                       |
| Docs formatting and link/reference validation              | Workspace / Clean CI  |                          |                       |

## Risk review

- **Authentication/authorization/ownership:**
- **Input/output validation and error leakage:**
- **PII/privacy/retention:**
- **Audit/observability:**
- **Concurrency/idempotency/state transitions:**
- **Accessibility/performance:**
- **Dependencies/supply chain:**
- **Threat-model findings and resolution:**
- **Known limitations/residual risk and human acceptance:**
- **Risk-exception ID, compensating controls, owner, and expiry (if any):**

## Database and configuration

- **Schema/migration impact:**
- **Generated SQL reviewed by:**
- **Empty and prior-version migration test:**
- **Backup/restore or forward-fix evidence:**
- **Environment/secret changes (names only):**
- **Configuration drift checked:**

## Release and recovery

- **Preview/staging evidence:**
- **Release artifact/digest:**
- **Deployment owner/approval:**
- **Smoke tests and business-flow checks:**
- **Monitoring dashboard/SLO and observation window:**
- **Rollback trigger, procedure, and owner:**
- **Customer/privacy communication needed:**

## Independent review

- **Implementation agent self-review complete:** Yes / No
- **Independent reviewer findings:**
- **Security/data/privacy review:**
- **Latest diff approved by human:**
- **Open blockers:**

## Post-release

- **Release outcome:**
- **Incidents/regressions:**
- **Rollback/forward-fix:**
- **New regression/evaluation cases:**
- **Knowledge/runbook updates:**
