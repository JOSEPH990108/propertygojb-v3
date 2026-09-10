# Agentic SDLC Work Items

Coding agents create work items here automatically for every requested repository mutation. Read-only explanations, status checks, and diagnoses do not create a file unless the user asks to formalize them.

## Naming

Existing sequential IDs remain valid. New automated items use `PG-YYYYMMDD-HHMMSS-XXXXXXXX-short-slug.md`, where `XXXXXXXX` is the first eight hexadecimal characters of a newly generated UUID. Create the file without overwrite semantics; on the unlikely collision, generate a new UUID and retry.

## Lifecycle

1. Copy `docs/templates/AI_AGENT_WORK_ITEM.md`.
2. Preserve the user's original request after removing secrets or personal data.
3. Add calculator output: request-only score, file-aware score, matched rule IDs, gates, and required checks.
4. Track status as `DRAFT`, `READY`, `APPROVED`, `IMPLEMENTED`, `VERIFIED`, `RELEASED`, `BLOCKED`, or `CANCELLED`.
5. For R0–R2 in guarded-auto mode, record the standing approval and proceed when there is no unresolved material decision.
6. For R3, the planning work item is the permitted pre-approval edit; stop before implementation/source/control edits until explicit human plan approval is recorded.
7. For request-only R4, return the advisory human-run plan in chat and do not create or update a repository file.
8. Link the completed change-evidence record or include it in the pull request.

Work items are delivery history, not the canonical source of business rules. Durable rules are promoted through the governed process in `docs/sdlc/SESSION_CONTEXT.md`.
