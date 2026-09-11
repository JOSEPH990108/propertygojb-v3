---
agent: agent
description: Turn a short request into a complete, risk-gated PropertyGoJB SDLC run.
---

# Run the PropertyGoJB auto-SDLC

Use the `propertygojb-agentic-sdlc` skill for the user's request. Treat their original words as the intake; do not require a completed template.

Load `docs/sdlc/SESSION_CONTEXT.md`, score the sanitized request, investigate the current implementation, derive requirements and acceptance criteria, and re-score the exact proposed files. Create the next work item under `docs/work-items/` only for an R1–R3 mutation; R0 remains read-only and R4 returns a human-run plan in chat without repository writes.

Proceed automatically only as allowed by the returned gate. R3 may write its planning work item, then stops before implementation/source/control edits for explicit approval. R4 remains a human-run plan. After permitted implementation, run the required checks, independently challenge the diff, re-score the final manifest, and report requirement coverage, changed files, rule IDs, evidence, residual risk, and rollback.

Record durable rule candidates in the work item. Do not activate learned policy without the required human approval.
