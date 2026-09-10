<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# PropertyGoJB Agentic SDLC

For every request that may change repository files or application behavior, use `.github/skills/propertygojb-agentic-sdlc/SKILL.md`. A few informal sentences are sufficient; infer routine details from code evidence and do not require the user to fill a template.

Read `docs/sdlc/SESSION_CONTEXT.md`, preserve unrelated work, and score the sanitized request before any repository mutation:

```text
npm run sdlc:score -- --request "<request>"
```

Re-score with exact proposed files. R0-R2 follow guarded autonomy. R3 may create/update its planning work item but needs explicit human approval before implementation/source/control edits. R4 is advice only. The canonical rule memory is `docs/sdlc/business-rules.json`. Only human-approved learned rules with `status: active` apply.

## UI generation

For UI creation or changes, read `docs/UI_DESIGN_GUIDE.md` before editing.
Inspect the closest existing screen, its shell, `src/app/globals.css`, and relevant
shared components. Reuse actual component APIs and semantic theme tokens.
Cover responsive layouts, keyboard/focus behavior, labels/errors, both themes,
reduced motion, and applicable loading/empty/error/pending/success states.
Preserve domain rules and report verification evidence and unverified cases.
This guide supplements the SDLC and does not change its approval gates.
