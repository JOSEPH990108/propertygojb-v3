import path from "node:path";

import { expect, test } from "vitest";

import {
  changedFilesFromGit,
  createDigest,
  globToRegExp,
  loadRulebook,
  parseArgs,
  scoreRequest,
  validateRulebook,
} from "./sdlc-score.mjs";

const rulebook = loadRulebook();

test("the committed registry is internally valid", () => {
  const result = validateRulebook(rulebook);
  expect(result.valid, result.errors.join("\n")).toBe(true);
  expect(result.counts.baseRules).toBe(44);
});

test("double-star globs match root and nested paths", () => {
  expect(globToRegExp("**/*.test.ts").test("viewing.test.ts")).toBe(true);
  expect(globToRegExp("**/*.test.ts").test("src/lib/viewing.test.ts")).toBe(
    true,
  );
  expect(
    globToRegExp("src/app/api/**/request-otp/**").test(
      "src/app/api/public/account/profile/phone/request-otp/route.ts",
    ),
  ).toBe(true);
});

test("read-only domain analysis stays R0 while loading rule context", () => {
  const result = scoreRequest("Explain the booking flow", [], { rulebook });
  expect(result.operation).toBe("read-only");
  expect(result.riskClass).toBe("R0");
  expect(result.totalScore).toBe(0);
  expect(result.matchedRules.some((rule) => rule.id === "BR-BOOK-001")).toBe(
    true,
  );
  expect(result.matchedRules.every((rule) => !rule.affectsRisk)).toBe(true);
  expect(result.mayImplementNow).toBe(false);
  expect(result.planningRecordMayBeWritten).toBe(false);
});

test("a harmless presentation fix is R1", () => {
  const result = scoreRequest(
    "Fix the button spacing",
    ["src/components/ui/button.tsx"],
    { rulebook },
  );
  expect(result.operation).toBe("change");
  expect(result.riskClass).toBe("R1");
  expect(result.totalScore).toBe(15);
});

test("an unknown behavior-changing feature defaults to R2", () => {
  const result = scoreRequest("Add a favourites feature", [], { rulebook });
  expect(result.riskClass).toBe("R2");
  expect(result.totalScore).toBe(30);
  expect(result.baseReason).toMatch(/defaults to R2/u);
});

test("viewing behavior is R2 and loads its invariant", () => {
  const result = scoreRequest(
    "Add viewing reschedule support",
    ["src/lib/public/viewing.ts"],
    { rulebook },
  );
  expect(result.riskClass).toBe("R2");
  expect(result.matchedRules.some((rule) => rule.id === "BR-VIEW-001")).toBe(
    true,
  );
});

test("authorization and role changes require the R3 implementation gate", () => {
  const result = scoreRequest(
    "Change user role permissions",
    ["src/app/api/admin/users/role/route.ts"],
    { rulebook },
  );
  expect(result.riskClass).toBe("R3");
  expect(result.approvalRequiredBeforeImplementation).toBe(true);
  expect(result.mayImplementNow).toBe(false);
  expect(result.planningRecordMayBeWritten).toBe(true);
  expect(result.matchedRules.some((rule) => rule.id === "BR-ROLE-001")).toBe(
    true,
  );
});

test("a real SUPER_ADMIN grant is an R4 hard stop", () => {
  const result = scoreRequest("Grant SUPER_ADMIN to this account", [], {
    rulebook,
  });
  expect(result.riskClass).toBe("R4");
  expect(result.blocked).toBe(true);
  expect(result.mayImplementNow).toBe(false);
  expect(result.planningRecordMayBeWritten).toBe(false);
  expect(result.matchedRules[0].id).toBe("BR-ROLE-002");
});

test("execution questions and mixed harmless wording cannot hide R4 actions", () => {
  const cases = [
    ["Can you refund this customer?", "BR-PAY-002"],
    ["Could you promote Bob to SUPER_ADMIN?", "BR-ROLE-002"],
    ["Can you ship this to production?", "BR-PROD-001"],
    ["Purge old customer accounts and fix wording", "BR-DESTROY-001"],
    ["Contact every customer via WhatsApp", "BR-WA-002"],
    ["Approve this customer document", "BR-DOC-003"],
  ];

  for (const [request, expectedRule] of cases) {
    const result = scoreRequest(request, [], { rulebook });
    expect(result.operation, request).toBe("change");
    expect(result.riskClass, request).toBe("R4");
    expect(
      result.matchedRules.some(
        (rule) => rule.id === expectedRule && rule.hardStopTriggered,
      ),
      request,
    ).toBe(true);
  }
});

test("analysis framing cannot hide a later restricted execution", () => {
  const cases = [
    ["Review the case. Refund this customer.", "BR-PAY-002"],
    ["Inspect this account. Grant SUPER_ADMIN to this user.", "BR-ROLE-002"],
    ["Explain your progress while you refund this customer", "BR-PAY-002"],
    ["Summarize the release while you deploy to production", "BR-PROD-001"],
    [
      "Analyze the impact before you delete all customer accounts.",
      "BR-DESTROY-001",
    ],
    ["I authorize you to refund this customer now", "BR-PAY-002"],
    ["Run rm -rf on the workspace", "BR-DESTROY-001"],
    ["Execute git clean -fd in the repository", "BR-DESTROY-001"],
    ["Set this account to SUPER_ADMIN", "BR-ROLE-002"],
    ["Perform a production deployment", "BR-PROD-001"],
    ["Access .env.local", "BR-SECRET-001"],
  ];

  for (const [request, expectedRule] of cases) {
    const result = scoreRequest(request, [], { rulebook });
    expect(result.riskClass, request).toBe("R4");
    expect(result.blocked, request).toBe(true);
    expect(
      result.matchedRules.some(
        (rule) => rule.id === expectedRule && rule.hardStopTriggered,
      ),
      request,
    ).toBe(true);
  }
});

test("pull-request approval, merge, and protected-branch pushes are R4", () => {
  const requests = [
    "Review and merge this PR",
    "Review this PR, then merge it",
    "Approve this pull request",
    "Push to main",
    "Merge this pull request",
  ];

  for (const request of requests) {
    const result = scoreRequest(request, [], { rulebook });
    expect(result.operation, request).toBe("change");
    expect(result.riskClass, request).toBe("R4");
    expect(result.blocked, request).toBe(true);
    expect(
      result.matchedRules.some(
        (rule) => rule.id === "BR-SCM-001" && rule.hardStopTriggered,
      ),
      request,
    ).toBe(true);
  }
});

test("source-control analysis and local workflow implementation stay below R4", () => {
  const analysis = scoreRequest("Explain how pull request merges work", [], {
    rulebook,
  });
  const implementation = scoreRequest(
    "Implement local pull request merge checks",
    [],
    { rulebook },
  );

  expect(analysis.riskClass).toBe("R0");
  expect(implementation.riskClass).toBe("R3");
  expect(
    implementation.matchedRules.some((rule) => rule.hardStopTriggered),
  ).toBe(false);
});

test("ordinary wording is not mistaken for a restricted action", () => {
  const requests = [
    "Change role for this user from AGENT to CUSTOMER",
    "Delete all unused imports",
    "Remove all dead CSS classes",
    "Change role validation so SUPER_ADMIN cannot be granted",
    "Change wording in the production deployment guide",
    "Approve the main navigation design",
    "Merge the main and mobile navigation components",
  ];

  for (const request of requests) {
    const result = scoreRequest(request, ["src/components/navigation.tsx"], {
      rulebook,
    });
    expect(result.riskClass, request).not.toBe("R4");
    expect(result.blocked, request).toBe(false);
  }
});

test("read-only follow-ons stay read-only outside restricted data", () => {
  for (const request of [
    "Review the tests, then list failures",
    "Explain the module, then summarize its exports",
  ]) {
    const result = scoreRequest(request, [], { rulebook });
    expect(result.operation, request).toBe("read-only");
    expect(result.riskClass, request).toBe("R0");
  }
});

test("analysis and synthetic implementation load restricted context without executing it", () => {
  const whatsappAnalysis = scoreRequest("Explain bulk WhatsApp design", [], {
    rulebook,
  });
  const refundAnalysis = scoreRequest(
    "Explain how a customer refund is approved",
    [],
    { rulebook },
  );
  const refundImplementation = scoreRequest(
    "Implement a synthetic payment refund workflow",
    [],
    { rulebook },
  );
  const deploymentImplementation = scoreRequest(
    "Build a production deployment pipeline",
    [],
    { rulebook },
  );

  expect(whatsappAnalysis.riskClass).toBe("R0");
  expect(refundAnalysis.riskClass).toBe("R0");
  expect(refundImplementation.riskClass).toBe("R3");
  expect(deploymentImplementation.riskClass).toBe("R3");
  expect(
    [
      ...refundImplementation.matchedRules,
      ...deploymentImplementation.matchedRules,
    ].some((rule) => rule.hardStopTriggered),
  ).toBe(false);
});

test("booking and migration changes cannot score below R3", () => {
  const booking = scoreRequest("Change booking cancellation rules", [], {
    rulebook,
  });
  const migration = scoreRequest(
    "Add a database column with a Drizzle migration",
    ["src/db/schema/bookings.ts"],
    { rulebook },
  );
  expect(booking.riskClass).toBe("R3");
  expect(migration.riskClass).toBe("R3");
});

test("low-risk words cannot hide unknown behavior changes", () => {
  const cache = scoreRequest(
    "Update cache invalidation logic and button spacing",
    ["src/lib/cache.ts"],
    { rulebook },
  );
  const login = scoreRequest(
    "Change login retry logic and typo",
    ["src/lib/login-policy.ts"],
    { rulebook },
  );

  expect(cache.riskClass).toBe("R2");
  expect(login.riskClass).toBe("R2");
});

test("all agent and delivery control paths have an R3 floor", () => {
  const files = [
    "docs/templates/AI_AGENT_WORK_ITEM.md",
    "docs/work-items/README.md",
    "src/AGENTS.md",
    "CODEOWNERS",
    ".npmrc",
    ".agents/skills/example/SKILL.md",
    ".claude/skills/example/SKILL.md",
    "infra/main.tf",
    "Dockerfile",
  ];

  for (const file of files) {
    const result = scoreRequest("Fix typo", [file], { rulebook });
    expect(result.riskClass, file).toBe("R3");
    expect(
      result.matchedRules.some((rule) => rule.id === "BR-CTRL-001"),
      file,
    ).toBe(true);
  }
});

test("real environment files are R4 but .env.example remains configuration R2", () => {
  const realEnvironment = scoreRequest(
    "Update environment configuration",
    [".env.local"],
    { rulebook },
  );
  const example = scoreRequest(
    "Document a new environment variable name",
    [".env.example"],
    { rulebook },
  );
  expect(realEnvironment.riskClass).toBe("R4");
  expect(realEnvironment.blocked).toBe(true);
  expect(example.riskClass).toBe("R2");
  expect(example.matchedRules.some((rule) => rule.id === "BR-SECRET-001")).toBe(
    false,
  );
});

test("absolute and traversal file inputs canonicalize inside the repository", () => {
  const absoluteRolePath = path.resolve(
    "src/app/api/admin/users/role/route.ts",
  );
  const absoluteEnvironmentPath = path.resolve(".env.local");
  const role = scoreRequest("Change role policy", [absoluteRolePath], {
    rulebook,
  });
  const environment = scoreRequest(
    "Update environment configuration",
    [absoluteEnvironmentPath],
    { rulebook },
  );
  const traversal = scoreRequest(
    "Update environment configuration",
    ["src/../.env.local"],
    { rulebook },
  );

  expect(role.files).toEqual(["src/app/api/admin/users/role/route.ts"]);
  expect(role.riskClass).toBe("R3");
  expect(environment.files).toEqual([".env.local"]);
  expect(environment.riskClass).toBe("R4");
  expect(traversal.files).toEqual([".env.local"]);
  expect(traversal.riskClass).toBe("R4");
  expect(() =>
    scoreRequest("Edit an outside file", [path.resolve("..", "outside.ts")], {
      rulebook,
    }),
  ).toThrow(/outside the repository/u);
  expect(() =>
    scoreRequest("Update environment configuration", [".env::$DATA"], {
      rulebook,
    }),
  ).toThrow(/alternate data streams/u);
});

test("CLI file manifests normalize every comma-separated path", () => {
  const result = parseArgs([
    "--request",
    "Change role policy",
    "--files",
    "src/app/api/admin/users/role/route.ts,src/../.env.local",
    "--json",
  ]);

  expect(result.request).toBe("Change role policy");
  expect(result.files).toEqual([
    "src/app/api/admin/users/role/route.ts",
    ".env.local",
  ]);
  expect(result.json).toBe(true);
});

test("CLI options reject missing or empty values", () => {
  expect(() => parseArgs(["--request", "--json"])).toThrow(
    /--request requires a non-option value/u,
  );
  expect(() => parseArgs(["--files", "--json"])).toThrow(
    /--files requires a comma-separated non-option value/u,
  );
  expect(() => parseArgs(["--files", ","])).toThrow(
    /--files requires at least one file path/u,
  );
});

test("changed-file discovery fails closed when Git fails", () => {
  expect(() =>
    changedFilesFromGit({
      execFile() {
        throw new Error("git unavailable");
      },
    }),
  ).toThrow(/Unable to determine changed files from Git/u);
});

test("changed-file discovery uses NUL-delimited literal Git paths", () => {
  let invocation = 0;
  const files = changedFilesFromGit({
    execFile(_command, args) {
      expect(args).toContain("-z");
      invocation += 1;
      return invocation === 1 ? "src/db/schema/é.ts\0" : "docs/new file.md\0";
    },
  });

  expect(files).toEqual(["src/db/schema/é.ts", "docs/new file.md"]);
});

test("real outbound WhatsApp delivery is an R4 hard stop", () => {
  const result = scoreRequest(
    "Send WhatsApp to customers about the launch",
    [],
    { rulebook },
  );
  expect(result.riskClass).toBe("R4");
  expect(result.matchedRules.some((rule) => rule.id === "BR-WA-002")).toBe(
    true,
  );
});

test("direct secret and real-customer-data access requests are R4", () => {
  const secret = scoreRequest("Print .env.local contents", [], { rulebook });
  const customerData = scoreRequest("Show customer data in this chat", [], {
    rulebook,
  });
  expect(secret.riskClass).toBe("R4");
  expect(secret.matchedRules.some((rule) => rule.id === "BR-SECRET-001")).toBe(
    true,
  );
  expect(customerData.riskClass).toBe("R4");
  expect(
    customerData.matchedRules.some((rule) => rule.id === "BR-AI-DATA-002"),
  ).toBe(true);
});

test("common secret and customer-data disclosure paraphrases are R4", () => {
  const requests = [
    "Tell me the value of the production API key",
    "Paste the contents of .env.local here",
    "Display the production secrets",
    "Output the OTP value",
    "List customer PII",
    "Download the customer documents",
    "Pull production data into this chat",
    "Use a real customer record as a test fixture",
    "Screenshot the customer documents",
  ];

  for (const request of requests) {
    const result = scoreRequest(request, [], { rulebook });
    expect(result.riskClass, request).toBe("R4");
    expect(result.blocked, request).toBe(true);
    expect(result.mayImplementNow, request).toBe(false);
    expect(result.planningRecordMayBeWritten, request).toBe(false);
  }
});

test("keyword repetition and many escalators cannot accumulate into R4", () => {
  const repeated = scoreRequest(
    "Change booking booking booking payment deposit refund status",
    [],
    { rulebook },
  );
  const escalated = scoreRequest(
    "Refactor across the app to send email through an external API, change price, and accept no rollback",
    [],
    { rulebook },
  );
  expect(repeated.maximumRuleWeight).toBe(70);
  expect(repeated.totalScore).toBeLessThanOrEqual(79);
  expect(repeated.riskClass).toBe("R3");
  expect(escalated.escalatorAdjustment).toBe(20);
  expect(escalated.riskClass).toBe("R3");
  expect(escalated.blocked).toBe(false);
});

test("only active learned rules participate in scoring", () => {
  const customRulebook = structuredClone(rulebook);
  const learnedBase = {
    category: "learned-policy",
    enforcement: "policy",
    weight: 55,
    riskFloor: "R3",
    paths: [],
    requires: ["owner-review"],
    sources: ["docs/work-items/example.md"],
    validation: ["Verify the learned invariant."],
  };
  customRulebook.learnedRules.push(
    {
      ...learnedBase,
      id: "BR-LEARN-001",
      status: "active",
      statement: "Moon-phase allocation needs owner approval.",
      keywords: ["moon phase allocation"],
      owner: "Product owner",
      approvedBy: "Product owner",
      approvedAt: "2026-09-01",
      reviewBy: "2027-09-01",
    },
    {
      ...learnedBase,
      id: "BR-LEARN-002",
      status: "proposed",
      statement: "Sun-phase allocation may need owner approval.",
      keywords: ["sun phase allocation"],
    },
  );

  const result = scoreRequest(
    "Implement moon phase allocation and sun phase allocation",
    [],
    { rulebook: customRulebook },
  );
  expect(result.matchedRules.some((rule) => rule.id === "BR-LEARN-001")).toBe(
    true,
  );
  expect(result.matchedRules.some((rule) => rule.id === "BR-LEARN-002")).toBe(
    false,
  );
  expect(result.riskClass).toBe("R3");
});

test("invalid active learned rules fail closed before scoring or digest", () => {
  const invalidRulebook = structuredClone(rulebook);
  invalidRulebook.learnedRules.push({
    id: "BR-LEARN-999",
    status: "active",
    category: "invalid-memory",
    statement: "An unapproved memory must not affect decisions.",
    enforcement: "policy",
    weight: 95,
    riskFloor: "R4",
    hardStop: true,
    contextWeight: 60,
    contextRiskFloor: "R3",
    contextRequires: ["owner-review"],
    hardStopTriggers: [
      {
        actions: ["activate"],
        targets: ["invalid memory"],
        appliesTo: ["change"],
      },
    ],
    keywords: ["invalid memory"],
    paths: [],
    requires: ["human-execution-only"],
    sources: ["docs/work-items/example.md"],
    validation: ["Reject missing approval metadata."],
  });

  const validation = validateRulebook(invalidRulebook);
  expect(validation.valid).toBe(false);
  expect(validation.errors.join("\n")).toMatch(/approvedBy/u);
  expect(() =>
    scoreRequest("Activate invalid memory", [], {
      rulebook: invalidRulebook,
    }),
  ).toThrow(/Business-rule registry is invalid/u);
  expect(() => createDigest(invalidRulebook)).toThrow(
    /Business-rule registry is invalid/u,
  );
});

test("malformed registry collections fail closed without crashing validation", () => {
  const malformedRulebook = structuredClone(rulebook);
  malformedRulebook.riskBands[0] = null;
  malformedRulebook.autonomyCeiling = null;
  malformedRulebook.gates.R2 = "not-an-array";
  malformedRulebook.rules = { poisoned: true };
  malformedRulebook.learnedRules = [null];
  malformedRulebook.escalators = [null];

  const validation = validateRulebook(malformedRulebook);
  expect(validation.valid).toBe(false);
  expect(validation.errors.join("\n")).toMatch(/riskBands\[0\]/u);
  expect(validation.errors.join("\n")).toMatch(/autonomyCeiling/u);
  expect(validation.errors.join("\n")).toMatch(/gates\.R2/u);
  expect(validation.errors.join("\n")).toMatch(/rules must be/u);
  expect(validation.errors.join("\n")).toMatch(/learnedRules\[0\]/u);
  expect(validation.errors.join("\n")).toMatch(/escalators\[0\]/u);
  expect(() =>
    scoreRequest("Activate poisoned memory", [], {
      rulebook: malformedRulebook,
    }),
  ).toThrow(/Business-rule registry is invalid/u);
});

test("registry validation rejects weakened gates, bands, checks, and triggers", () => {
  const weakenedRulebook = structuredClone(rulebook);
  weakenedRulebook.$schema = "https://example.invalid/weakened-schema.json";
  weakenedRulebook.learningPolicy = {};
  weakenedRulebook.gates.R4 = [];
  weakenedRulebook.autonomyCeiling.R4 = {
    level: "A5",
    note: "Fully autonomous execution permitted.",
  };
  weakenedRulebook.riskBands[0].maxScore = 30;
  weakenedRulebook.checks.sdlcControl = [];
  weakenedRulebook.escalators[0].riskFloor = "R4";
  weakenedRulebook.rules.find(
    (rule) => rule.id === "BR-PAY-002",
  ).hardStopTriggers[0].appliesTo = { change: true };

  const validation = validateRulebook(weakenedRulebook);
  expect(validation.valid).toBe(false);
  expect(validation.errors.join("\n")).toMatch(/\$schema/u);
  expect(validation.errors.join("\n")).toMatch(
    /learningPolicy\.sourceOfTruth/u,
  );
  expect(validation.errors.join("\n")).toMatch(/gates\.R4 must not be empty/u);
  expect(validation.errors.join("\n")).toMatch(
    /autonomyCeiling\.R4\.level must remain A0/u,
  );
  expect(validation.errors.join("\n")).toMatch(
    /riskBands\[0\]\.maxScore must be 9/u,
  );
  expect(validation.errors.join("\n")).toMatch(
    /checks\.sdlcControl must not be empty/u,
  );
  expect(validation.errors.join("\n")).toMatch(
    /escalators\[0\]\.riskFloor must be R2 or R3/u,
  );
  expect(validation.errors.join("\n")).toMatch(/appliesTo must be an array/u);
  expect(() =>
    scoreRequest("Add an unknown feature", [], {
      rulebook: weakenedRulebook,
    }),
  ).toThrow(/Business-rule registry is invalid/u);
});

test("base-rule memory bypasses and invalid approval dates are rejected", () => {
  const invalidMemoryRulebook = structuredClone(rulebook);
  const ruleFields = {
    category: "learned-policy",
    statement: "Invalid memory must not influence decisions.",
    enforcement: "policy",
    weight: 55,
    riskFloor: "R3",
    keywords: ["invalid memory"],
    paths: [],
    requires: ["owner-review"],
    sources: ["docs/work-items/example.md"],
    validation: ["Reject the invalid rule."],
  };
  invalidMemoryRulebook.rules.push({
    ...ruleFields,
    id: "BR-LEARN-BYPASS",
    status: "proposed",
  });
  invalidMemoryRulebook.learnedRules.push({
    ...ruleFields,
    id: "BR-LEARN-BAD-DATE",
    status: "active",
    owner: "Product owner",
    approvedBy: "Product owner",
    approvedAt: "2026-99-99",
    reviewBy: "9999-99-99",
  });

  const validation = validateRulebook(invalidMemoryRulebook);
  expect(validation.valid).toBe(false);
  expect(validation.errors.join("\n")).toMatch(/reserved for learnedRules/u);
  expect(validation.errors.join("\n")).toMatch(
    /status is allowed only in learnedRules/u,
  );
  expect(validation.errors.join("\n")).toMatch(/valid YYYY-MM-DD date/u);
  expect(() =>
    scoreRequest("Implement invalid memory", [], {
      rulebook: invalidMemoryRulebook,
    }),
  ).toThrow(/Business-rule registry is invalid/u);
});
