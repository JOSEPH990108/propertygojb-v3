#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(modulePath), "..");
const defaultRulesPath = path.join(
  repoRoot,
  "docs",
  "sdlc",
  "business-rules.json",
);

const RISK_ORDER = ["R0", "R1", "R2", "R3", "R4"];
const ENFORCEMENT_STATES = ["enforced", "partial", "planned", "policy"];
const LEARNED_STATES = ["proposed", "active", "retired", "superseded"];
const EXPECTED_AUTONOMY_LEVELS = {
  R0: "A1",
  R1: "A2",
  R2: "A2",
  R3: "A2",
  R4: "A0",
};
const MANDATORY_GATES = {
  R3: ["human-plan-approval-before-implementation", "independent-review"],
  R4: ["human-execution-only", "no-autonomous-action"],
};
const EXPECTED_RISK_BANDS = [
  { class: "R0", minScore: 0, maxScore: 9 },
  { class: "R1", minScore: 10, maxScore: 24 },
  { class: "R2", minScore: 25, maxScore: 49 },
  { class: "R3", minScore: 50, maxScore: 79 },
  { class: "R4", minScore: 80, maxScore: 100 },
];
const MANDATORY_CHECKS = {
  always: [
    "git diff --check",
    "scope review against the declared file manifest",
  ],
  sdlcControl: ["npm run sdlc:validate", "npm run test:sdlc"],
};
const REQUIRED_ACTIVE_RULE_FIELDS = [
  "id",
  "status",
  "category",
  "statement",
  "enforcement",
  "owner",
  "approvedBy",
  "approvedAt",
  "reviewBy",
  "sources",
  "weight",
  "riskFloor",
  "keywords",
  "paths",
  "requires",
  "validation",
];

const CHANGE_PHRASES = [
  "add",
  "approve",
  "assign",
  "automate",
  "backfill",
  "blast",
  "broadcast",
  "build",
  "change",
  "charge",
  "contact",
  "configure",
  "correct",
  "create",
  "delete",
  "deploy",
  "disable",
  "drop",
  "edit",
  "elevate",
  "email",
  "enable",
  "erase",
  "execute",
  "fix",
  "grant",
  "implement",
  "impersonate",
  "install",
  "issue",
  "make",
  "mark",
  "mass update",
  "merge",
  "message",
  "migrate",
  "modify",
  "move",
  "notify",
  "patch",
  "perform",
  "promote",
  "publish",
  "purge",
  "push",
  "process",
  "refactor",
  "reject",
  "refund",
  "release",
  "remove",
  "rename",
  "replace",
  "reverse",
  "rotate",
  "run",
  "send",
  "set",
  "ship",
  "self-approve",
  "trigger",
  "truncate",
  "update",
  "upgrade",
  "verify",
  "waive",
  "wipe",
  "write",
];

const READ_ONLY_PHRASES = [
  "analyze",
  "compare",
  "describe",
  "diagnose",
  "explain",
  "find",
  "how does",
  "inspect",
  "list",
  "review",
  "show me how",
  "show status",
  "summarize",
  "tell me",
  "trace",
  "walk me through",
  "what is",
  "what are",
  "where is",
  "why does",
];

const BENIGN_CHANGE_PHRASES = new Set([
  "change",
  "edit",
  "fix",
  "replace",
  "update",
  "write",
]);

const LOW_RISK_CHANGE_PHRASES = [
  "alignment",
  "button spacing",
  "copy change",
  "documentation",
  "font size",
  "formatting",
  "icon size",
  "margin",
  "padding",
  "readme",
  "spacing",
  "text label",
  "typo",
  "wording",
];

export function normalizeFilePath(file, root = repoRoot) {
  const raw = String(file ?? "").trim();
  if (!raw) return "";
  if (raw.includes("\0"))
    throw new Error("File paths cannot contain NUL bytes.");
  const withoutDrive = /^[a-z]:[\\/]/iu.test(raw) ? raw.slice(2) : raw;
  if (withoutDrive.includes(":")) {
    throw new Error(
      `File paths cannot use NTFS alternate data streams: ${raw}`,
    );
  }

  const resolved = path.resolve(root, raw);
  const relative = path.relative(root, resolved);
  const outside =
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative);
  if (outside) {
    throw new Error(`File path is outside the repository: ${raw}`);
  }
  if (!relative || relative === ".") {
    throw new Error(
      `Expected a file path, received the repository root: ${raw}`,
    );
  }
  return relative.replaceAll("\\", "/");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phrasePattern(phrase) {
  return String(phrase).trim().split(/\s+/u).map(escapeRegExp).join("\\s+");
}

function phraseRegExp(phrase) {
  const pattern = phrasePattern(phrase);
  return new RegExp(`(^|[^a-z0-9_])${pattern}(?=$|[^a-z0-9_])`, "iu");
}

function matchingPhrases(phrases, text) {
  return (phrases ?? []).filter((phrase) => phraseRegExp(phrase).test(text));
}

export function globToRegExp(glob) {
  const escaped = String(glob).replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped
    .replace(/\*\*\//g, "\u0000")
    .replace(/\*\*/g, "\u0001")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\u0000/g, "(?:.*/)?")
    .replace(/\u0001/g, ".*");
  return new RegExp(`^${pattern}$`, "iu");
}

function matchesGlob(globs, file) {
  return (globs ?? []).some((glob) => globToRegExp(glob).test(file));
}

function matchingPaths(rule, files) {
  const included = [];
  for (const file of files) {
    if (matchesGlob(rule.excludePaths, file)) continue;
    for (const glob of rule.paths ?? []) {
      if (globToRegExp(glob).test(file)) included.push(`${glob} <= ${file}`);
    }
  }
  return [...new Set(included)];
}

function highestRisk(first, second) {
  return RISK_ORDER.indexOf(first) >= RISK_ORDER.indexOf(second)
    ? first
    : second;
}

function bandForScore(rulebook, score) {
  return (
    rulebook.riskBands.find(
      (band) => score >= band.minScore && score <= band.maxScore,
    ) ?? rulebook.riskBands.at(-1)
  );
}

function bandForClass(rulebook, riskClass) {
  return rulebook.riskBands.find((band) => band.class === riskClass);
}

function unique(values) {
  return [...new Set(values)];
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

const REQUEST_PREFIX_PATTERN =
  "(?:(?:(?:please|kindly|actually|immediately|possibly)\\s+)|(?:(?:can|could|would|will)\\s+you\\s+)|(?:i\\s+(?:want|need)\\s+you\\s+to\\s+)|(?:i\\s+authou?ri[sz]e\\s+you\\s+to\\s+)|(?:we\\s+(?:want|need|should)\\s+to\\s+)|(?:help\\s+me(?:\\s+to)?\\s+))*";
const ACTION_HELPER_PATTERN =
  "(?:(?:(?:go\\s+ahead\\s+and|proceed\\s+to|run|execute|perform|carry\\s+out|do)(?:\\s+(?:a|an|the))?)\\s+)*";
const EXECUTION_CONNECTOR_PATTERN =
  "(?:[.!?;,]|\\b(?:and|then|also|before|after|afterwards|while|whilst)\\b(?:\\s+you)?|\\bas\\s+you\\b)";

function phraseAlternation(phrases) {
  return [...phrases]
    .sort((first, second) => second.length - first.length)
    .map(phrasePattern)
    .join("|");
}

function isAnalysisFramed(request) {
  const starters = phraseAlternation(READ_ONLY_PHRASES);
  return new RegExp(
    `^\\s*${REQUEST_PREFIX_PATTERN}(?:${starters})(?=$|[^a-z0-9_])`,
    "iu",
  ).test(request);
}

function directActionRegExp(action) {
  const pattern = phrasePattern(action);
  return new RegExp(
    `^\\s*${REQUEST_PREFIX_PATTERN}${ACTION_HELPER_PATTERN}${pattern}(?=$|[^a-z0-9_])`,
    "iu",
  );
}

function connectedActionRegExp(action) {
  const pattern = phrasePattern(action);
  return new RegExp(
    `${EXECUTION_CONNECTOR_PATTERN}\\s*${REQUEST_PREFIX_PATTERN}${ACTION_HELPER_PATTERN}${pattern}(?=$|[^a-z0-9_])`,
    "iu",
  );
}

function requestedActionPhrases(actions, request) {
  if (!actions?.length) return [];
  const hits = [];
  for (const action of actions) {
    if (
      directActionRegExp(action).test(request) ||
      connectedActionRegExp(action).test(request)
    ) {
      hits.push(action);
    }
  }
  return hits;
}

function hasExecutionAfterAnalysis(request) {
  return CHANGE_PHRASES.some((action) =>
    connectedActionRegExp(action).test(request),
  );
}

function matchingHardStopTriggers(rule, request, operation) {
  const results = [];
  for (const [index, trigger] of (rule.hardStopTriggers ?? []).entries()) {
    const actionHits = matchingPhrases(trigger.actions, request);
    const targetHits = matchingPhrases(trigger.targets, request);
    if (actionHits.length === 0 || targetHits.length === 0) continue;
    const requestedActions = requestedActionPhrases(trigger.actions, request);
    results.push({
      index,
      actionHits,
      targetHits,
      requestedActions,
      triggered:
        requestedActions.length > 0 &&
        (trigger.appliesTo ?? ["change"]).includes(operation),
    });
  }
  return results;
}

export function changedFilesFromGit(options = {}) {
  const execFile = options.execFile ?? execFileSync;
  try {
    const tracked = execFile("git", ["diff", "--name-only", "-z", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const untracked = execFile(
      "git",
      ["ls-files", "--others", "--exclude-standard", "-z"],
      { cwd: repoRoot, encoding: "utf8" },
    );
    return unique(
      [...tracked.split("\0"), ...untracked.split("\0")]
        .map((file) => normalizeFilePath(file))
        .filter(Boolean),
    );
  } catch (error) {
    throw new Error(
      `Unable to determine changed files from Git: ${error.message}`,
      { cause: error },
    );
  }
}

function classifyIntent(request, files) {
  const changeSignals = matchingPhrases(CHANGE_PHRASES, request);
  const readOnlySignals = matchingPhrases(READ_ONLY_PHRASES, request);
  const looksLikeQuestion = /\?\s*$/u.test(request.trim());
  const analysisFramed = isAnalysisFramed(request);
  const operation =
    analysisFramed && !hasExecutionAfterAnalysis(request)
      ? "read-only"
      : "change";
  const docsOnly =
    files.length > 0 && files.every((file) => /\.(?:md|mdx|txt)$/iu.test(file));
  const presentationOnly =
    files.length > 0 &&
    files.every((file) =>
      /^(?:src\/(?:app|components)\/.*\.(?:css|jsx|tsx)|src\/app\/globals\.css|public\/)/iu.test(
        file,
      ),
    );
  const lowRiskSignals = matchingPhrases(LOW_RISK_CHANGE_PHRASES, request);
  const nonHarmlessChangeSignals = changeSignals.filter(
    (signal) => !BENIGN_CHANGE_PHRASES.has(signal),
  );
  const harmlessQualified =
    operation === "change" &&
    (docsOnly || (presentationOnly && lowRiskSignals.length > 0)) &&
    nonHarmlessChangeSignals.length === 0;

  return {
    operation,
    changeSignals,
    readOnlySignals,
    analysisFramed,
    looksLikeQuestion,
    lowRiskSignals,
    nonHarmlessChangeSignals,
    harmlessQualified,
    docsOnly,
    presentationOnly,
  };
}

export function loadRulebook(filePath = defaultRulesPath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function validateStringList(errors, value, location) {
  if (!Array.isArray(value)) {
    errors.push(`${location} must be an array.`);
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "string" || entry.trim() === "") {
      errors.push(`${location}[${index}] must be a non-empty string.`);
    }
  });
}

function validateHardStopTriggers(errors, value, location) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${location} must be a non-empty array.`);
    return;
  }
  value.forEach((trigger, index) => {
    const triggerLocation = `${location}[${index}]`;
    if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) {
      errors.push(`${triggerLocation} must be an object.`);
      return;
    }
    validateStringList(errors, trigger.actions, `${triggerLocation}.actions`);
    validateStringList(errors, trigger.targets, `${triggerLocation}.targets`);
    validateStringList(
      errors,
      trigger.appliesTo,
      `${triggerLocation}.appliesTo`,
    );
    if (Array.isArray(trigger.appliesTo)) {
      for (const operation of trigger.appliesTo) {
        if (!["change", "read-only"].includes(operation)) {
          errors.push(`${triggerLocation}.appliesTo contains ${operation}.`);
        }
      }
    }
    if (Array.isArray(trigger.actions) && trigger.actions.length === 0) {
      errors.push(`${triggerLocation}.actions must not be empty.`);
    }
    if (Array.isArray(trigger.targets) && trigger.targets.length === 0) {
      errors.push(`${triggerLocation}.targets must not be empty.`);
    }
    if (Array.isArray(trigger.appliesTo) && trigger.appliesTo.length === 0) {
      errors.push(`${triggerLocation}.appliesTo must not be empty.`);
    }
  });
}

function validateRule(errors, rule, location, learned = false) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    errors.push(`${location} must be an object.`);
    return;
  }
  const required = [
    "id",
    "category",
    "statement",
    "enforcement",
    "weight",
    "riskFloor",
    "keywords",
    "paths",
    "requires",
    "sources",
    "validation",
  ];
  for (const field of required) {
    if (!(field in rule)) errors.push(`${location}.${field} is required.`);
  }
  if (!/^BR-[A-Z0-9-]+$/u.test(rule.id ?? "")) {
    errors.push(`${location}.id must match BR-[A-Z0-9-]+.`);
  }
  if (learned && !String(rule.id ?? "").startsWith("BR-LEARN-")) {
    errors.push(`${location}.id must start with BR-LEARN-.`);
  }
  if (!learned && String(rule.id ?? "").startsWith("BR-LEARN-")) {
    errors.push(`${location}.id is reserved for learnedRules.`);
  }
  if (!learned && rule.status !== undefined) {
    errors.push(`${location}.status is allowed only in learnedRules.`);
  }
  if (!ENFORCEMENT_STATES.includes(rule.enforcement)) {
    errors.push(`${location}.enforcement is invalid.`);
  }
  for (const field of ["category", "statement"]) {
    if (typeof rule[field] !== "string" || rule[field].trim() === "") {
      errors.push(`${location}.${field} must be a non-empty string.`);
    }
  }
  if (!Number.isInteger(rule.weight) || rule.weight < 0 || rule.weight > 100) {
    errors.push(`${location}.weight must be an integer from 0 to 100.`);
  }
  if (!RISK_ORDER.includes(rule.riskFloor)) {
    errors.push(`${location}.riskFloor is invalid.`);
  }
  if (rule.riskFloor === "R4" && rule.hardStop !== true) {
    errors.push(`${location} has an R4 floor but is not marked hardStop.`);
  }
  if (rule.hardStop === true && rule.riskFloor !== "R4") {
    errors.push(`${location} is hardStop but does not have an R4 floor.`);
  }
  if (rule.hardStop === true && rule.weight < 80) {
    errors.push(`${location} is hardStop but has a weight below 80.`);
  }
  if (rule.hardStop === true) {
    if (
      !Number.isInteger(rule.contextWeight) ||
      rule.contextWeight < 0 ||
      rule.contextWeight > 79
    ) {
      errors.push(`${location}.contextWeight must be an integer from 0 to 79.`);
    }
    if (
      !RISK_ORDER.includes(rule.contextRiskFloor) ||
      rule.contextRiskFloor === "R4"
    ) {
      errors.push(`${location}.contextRiskFloor must be R0 through R3.`);
    }
    validateStringList(
      errors,
      rule.contextRequires,
      `${location}.contextRequires`,
    );
    if (
      Array.isArray(rule.contextRequires) &&
      rule.contextRequires.length === 0
    ) {
      errors.push(`${location}.contextRequires must not be empty.`);
    }
    validateHardStopTriggers(
      errors,
      rule.hardStopTriggers,
      `${location}.hardStopTriggers`,
    );
  } else if (rule.hardStopTriggers !== undefined) {
    errors.push(`${location} has hardStopTriggers but is not hardStop.`);
  }
  for (const field of [
    "keywords",
    "paths",
    "requires",
    "sources",
    "validation",
  ]) {
    validateStringList(errors, rule[field], `${location}.${field}`);
  }
  if (rule.excludePaths !== undefined) {
    validateStringList(errors, rule.excludePaths, `${location}.excludePaths`);
  }
  if ((rule.keywords?.length ?? 0) + (rule.paths?.length ?? 0) === 0) {
    errors.push(`${location} needs at least one keyword or path.`);
  }
  for (const field of ["requires", "sources", "validation"]) {
    if (Array.isArray(rule[field]) && rule[field].length === 0) {
      errors.push(`${location}.${field} must not be empty.`);
    }
  }
  if (Array.isArray(rule.paths)) {
    for (const [index, glob] of rule.paths.entries()) {
      try {
        globToRegExp(glob);
      } catch (error) {
        errors.push(`${location}.paths[${index}] is invalid: ${error.message}`);
      }
    }
  }
  if (learned) {
    if (!LEARNED_STATES.includes(rule.status)) {
      errors.push(`${location}.status is invalid.`);
    }
    if (rule.status === "active") {
      for (const field of ["owner", "approvedBy", "approvedAt", "reviewBy"]) {
        if (typeof rule[field] !== "string" || rule[field].trim() === "") {
          errors.push(`${location}.${field} is required for an active rule.`);
        }
      }
      for (const field of ["approvedAt", "reviewBy"]) {
        if (typeof rule[field] === "string" && !isValidIsoDate(rule[field])) {
          errors.push(`${location}.${field} must use a valid YYYY-MM-DD date.`);
        }
      }
    }
  }
}

export function validateRulebook(rulebook = loadRulebook()) {
  const errors = [];
  const warnings = [];

  if (!rulebook || typeof rulebook !== "object" || Array.isArray(rulebook)) {
    return {
      valid: false,
      errors: ["The registry root must be an object."],
      warnings,
    };
  }

  for (const field of ["version", "updatedAt", "owner", "policy"]) {
    if (typeof rulebook[field] !== "string" || rulebook[field].trim() === "") {
      errors.push(`${field} must be a non-empty string.`);
    }
  }
  if (!/^\d+\.\d+\.\d+$/u.test(rulebook.version ?? "")) {
    errors.push("version must use semantic X.Y.Z form.");
  }
  if (!isValidIsoDate(rulebook.updatedAt)) {
    errors.push("updatedAt must use a valid YYYY-MM-DD date.");
  }
  if (!isRecord(rulebook.learningPolicy)) {
    errors.push("learningPolicy must be an object.");
  } else {
    for (const field of ["sourceOfTruth", "candidateState", "promotionGate"]) {
      if (
        typeof rulebook.learningPolicy[field] !== "string" ||
        rulebook.learningPolicy[field].trim() === ""
      ) {
        errors.push(`learningPolicy.${field} must be a non-empty string.`);
      }
    }
    validateStringList(
      errors,
      rulebook.learningPolicy.requiredActiveFields,
      "learningPolicy.requiredActiveFields",
    );
    if (Array.isArray(rulebook.learningPolicy.requiredActiveFields)) {
      for (const field of REQUIRED_ACTIVE_RULE_FIELDS) {
        if (!rulebook.learningPolicy.requiredActiveFields.includes(field)) {
          errors.push(
            `learningPolicy.requiredActiveFields must include ${field}.`,
          );
        }
      }
    }
  }
  if (!isRecord(rulebook.checks)) {
    errors.push("checks must be an object.");
  } else {
    for (const checkGroup of [
      "always",
      "code",
      "schema",
      "dependencies",
      "docsOnly",
      "sdlcControl",
    ]) {
      validateStringList(
        errors,
        rulebook.checks[checkGroup],
        `checks.${checkGroup}`,
      );
      if (
        Array.isArray(rulebook.checks[checkGroup]) &&
        rulebook.checks[checkGroup].length === 0
      ) {
        errors.push(`checks.${checkGroup} must not be empty.`);
      }
      for (const mandatoryCheck of MANDATORY_CHECKS[checkGroup] ?? []) {
        if (!(rulebook.checks[checkGroup] ?? []).includes?.(mandatoryCheck)) {
          errors.push(`checks.${checkGroup} must include ${mandatoryCheck}.`);
        }
      }
    }
  }

  if (!Array.isArray(rulebook.riskBands) || rulebook.riskBands.length !== 5) {
    errors.push("riskBands must contain exactly R0 through R4.");
  } else {
    rulebook.riskBands.forEach((band, index) => {
      if (!isRecord(band)) {
        errors.push(`riskBands[${index}] must be an object.`);
        return;
      }
      const expected = EXPECTED_RISK_BANDS[index];
      if (band.class !== expected.class) {
        errors.push(`riskBands[${index}].class must be ${expected.class}.`);
      }
      if (typeof band.label !== "string" || band.label.trim() === "") {
        errors.push(`riskBands[${index}].label must be a non-empty string.`);
      }
      if (band.minScore !== expected.minScore) {
        errors.push(
          `riskBands[${index}].minScore must be ${expected.minScore}.`,
        );
      }
      if (band.maxScore !== expected.maxScore) {
        errors.push(
          `riskBands[${index}].maxScore must be ${expected.maxScore}.`,
        );
      }
    });
  }

  for (const mapName of ["autonomyCeiling", "gates"]) {
    const value = rulebook[mapName];
    if (!isRecord(value)) {
      errors.push(`${mapName} must be an object.`);
      continue;
    }
    for (const riskClass of RISK_ORDER) {
      if (!(riskClass in value)) {
        errors.push(`${mapName}.${riskClass} is required.`);
        continue;
      }
      if (mapName === "gates") {
        validateStringList(errors, value[riskClass], `${mapName}.${riskClass}`);
        if (Array.isArray(value[riskClass])) {
          if (value[riskClass].length === 0) {
            errors.push(`${mapName}.${riskClass} must not be empty.`);
          }
          for (const mandatoryGate of MANDATORY_GATES[riskClass] ?? []) {
            if (!value[riskClass].includes(mandatoryGate)) {
              errors.push(
                `${mapName}.${riskClass} must include ${mandatoryGate}.`,
              );
            }
          }
        }
      } else if (!isRecord(value[riskClass])) {
        errors.push(`${mapName}.${riskClass} must be an object.`);
      } else {
        if (!/^A[0-5]$/u.test(value[riskClass].level ?? "")) {
          errors.push(`${mapName}.${riskClass}.level must be A0 through A5.`);
        } else if (
          value[riskClass].level !== EXPECTED_AUTONOMY_LEVELS[riskClass]
        ) {
          errors.push(
            `${mapName}.${riskClass}.level must remain ${EXPECTED_AUTONOMY_LEVELS[riskClass]}.`,
          );
        }
        if (
          typeof value[riskClass].note !== "string" ||
          value[riskClass].note.trim() === ""
        ) {
          errors.push(
            `${mapName}.${riskClass}.note must be a non-empty string.`,
          );
        }
      }
    }
  }

  if (!Array.isArray(rulebook.rules) || rulebook.rules.length === 0) {
    errors.push("rules must be a non-empty array.");
  }
  if (!Array.isArray(rulebook.learnedRules)) {
    errors.push("learnedRules must be an array.");
  }
  if (!Array.isArray(rulebook.escalators)) {
    errors.push("escalators must be an array.");
  }

  const baseRules = Array.isArray(rulebook.rules) ? rulebook.rules : [];
  const learnedRules = Array.isArray(rulebook.learnedRules)
    ? rulebook.learnedRules
    : [];
  const escalators = Array.isArray(rulebook.escalators)
    ? rulebook.escalators
    : [];

  const ids = new Set();
  for (const [index, rule] of baseRules.entries()) {
    validateRule(errors, rule, `rules[${index}]`);
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) continue;
    if (ids.has(rule.id)) errors.push(`Duplicate rule id: ${rule.id}.`);
    ids.add(rule.id);
  }
  for (const [index, rule] of learnedRules.entries()) {
    validateRule(errors, rule, `learnedRules[${index}]`, true);
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) continue;
    if (ids.has(rule.id)) errors.push(`Duplicate rule id: ${rule.id}.`);
    ids.add(rule.id);
  }

  const escalatorIds = new Set();
  for (const [index, escalator] of escalators.entries()) {
    const location = `escalators[${index}]`;
    if (!isRecord(escalator)) {
      errors.push(`${location} must be an object.`);
      continue;
    }
    if (!/^ESC-[A-Z0-9-]+$/u.test(escalator.id ?? "")) {
      errors.push(`${location}.id is invalid.`);
    }
    if (escalatorIds.has(escalator.id)) {
      errors.push(`Duplicate escalator id: ${escalator.id}.`);
    }
    escalatorIds.add(escalator.id);
    if (
      !Number.isInteger(escalator.weight) ||
      escalator.weight < 0 ||
      escalator.weight > 20
    ) {
      errors.push(`${location}.weight must be an integer from 0 to 20.`);
    }
    if (!["R2", "R3"].includes(escalator.riskFloor)) {
      errors.push(`${location}.riskFloor must be R2 or R3.`);
    }
    if (typeof escalator.when !== "string" || escalator.when.trim() === "") {
      errors.push(`${location}.when must be a non-empty string.`);
    }
    validateStringList(errors, escalator.keywords, `${location}.keywords`);
  }

  const schemaReference = rulebook.$schema;
  if (schemaReference !== "./business-rules.schema.json") {
    errors.push(
      "$schema must reference ./business-rules.schema.json for this registry.",
    );
  } else {
    const schemaPath = path.resolve(
      path.dirname(defaultRulesPath),
      schemaReference,
    );
    if (!existsSync(schemaPath))
      errors.push(`Referenced schema is missing: ${schemaPath}`);
  }

  for (const rule of learnedRules.filter(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      entry.status === "active",
  )) {
    if (isValidIsoDate(rule.reviewBy)) {
      const today = new Date().toISOString().slice(0, 10);
      if (rule.reviewBy < today)
        warnings.push(`${rule.id} passed reviewBy ${rule.reviewBy}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts: {
      baseRules: baseRules.length,
      activeLearnedRules: learnedRules.filter(
        (rule) => isRecord(rule) && rule.status === "active",
      ).length,
      proposedLearnedRules: learnedRules.filter(
        (rule) => isRecord(rule) && rule.status === "proposed",
      ).length,
    },
  };
}

function assertValidRulebook(rulebook) {
  const validation = validateRulebook(rulebook);
  if (!validation.valid) {
    throw new Error(
      `Business-rule registry is invalid:\n${validation.errors
        .map((error) => `- ${error}`)
        .join("\n")}`,
    );
  }
  return validation;
}

function checksFor(rulebook, operation, files, matchedRules) {
  if (operation === "read-only") return ["evidence and source review"];

  const checks = [...(rulebook.checks.always ?? [])];
  const docsOnly =
    files.length > 0 && files.every((file) => /\.(?:md|mdx|txt)$/iu.test(file));
  if (docsOnly) checks.push(...(rulebook.checks.docsOnly ?? []));
  else checks.push(...(rulebook.checks.code ?? []));

  if (
    files.some((file) =>
      /^(?:src\/db\/schema\/|drizzle\/|drizzle\.config\.ts$)/iu.test(file),
    )
  ) {
    checks.push(...(rulebook.checks.schema ?? []));
  }
  if (
    files.some((file) => /^(?:package|npm-shrinkwrap).*\.json$/iu.test(file))
  ) {
    checks.push(...(rulebook.checks.dependencies ?? []));
  }
  if (
    matchedRules.some((rule) => rule.id === "BR-CTRL-001") ||
    files.some((file) =>
      /^(?:(?:.*\/)?(?:AGENTS|CLAUDE)\.md|\.(?:agents|claude|codex|github)\/|CODEOWNERS$|docs\/(?:sdlc\/|templates\/|AI_AGENTIC_SDLC\.md$|work-items\/README\.md$)|scripts\/sdlc-|package(?:-lock)?\.json$|\.npmrc$|\.mcp\.json$|.*\/mcp\.json$)/iu.test(
        file,
      ),
    )
  ) {
    checks.push(...(rulebook.checks.sdlcControl ?? []));
  }
  return unique(checks);
}

export function scoreRequest(request, files = [], options = {}) {
  const rulebook = options.rulebook ?? loadRulebook(options.rulebookPath);
  assertValidRulebook(rulebook);
  const normalizedRequest = String(request ?? "")
    .trim()
    .toLowerCase();
  const normalizedFiles = unique(
    files.map((file) => normalizeFilePath(file)).filter(Boolean),
  );
  const intent = classifyIntent(normalizedRequest, normalizedFiles);
  const scoringRules = [
    ...(rulebook.rules ?? []),
    ...(rulebook.learnedRules ?? []).filter((rule) => rule.status === "active"),
  ];

  const matchedRules = [];
  let riskFloor = intent.operation === "read-only" ? "R0" : "R1";
  let maximumRuleWeight = 0;
  let hasHardStop = false;

  for (const rule of scoringRules) {
    const explicitId = phraseRegExp(rule.id).test(normalizedRequest)
      ? [rule.id]
      : [];
    const keywords = matchingPhrases(rule.keywords, normalizedRequest);
    const paths = matchingPaths(rule, normalizedFiles);
    const hardStopTriggers = matchingHardStopTriggers(
      rule,
      normalizedRequest,
      intent.operation,
    );
    if (
      explicitId.length === 0 &&
      keywords.length === 0 &&
      paths.length === 0 &&
      hardStopTriggers.length === 0
    ) {
      continue;
    }

    const hardStopMatched =
      rule.hardStop === true &&
      (paths.length > 0 ||
        hardStopTriggers.some((trigger) => trigger.triggered));
    const restrictedContext = rule.hardStop === true && !hardStopMatched;
    const affectsRisk = hardStopMatched || intent.operation === "change";
    const appliedWeight = restrictedContext ? rule.contextWeight : rule.weight;
    const appliedRiskFloor = restrictedContext
      ? rule.contextRiskFloor
      : rule.riskFloor;
    const appliedRequires = restrictedContext
      ? rule.contextRequires
      : rule.requires;
    if (affectsRisk) {
      maximumRuleWeight = Math.max(maximumRuleWeight, appliedWeight);
      riskFloor = highestRisk(riskFloor, appliedRiskFloor);
    }
    if (hardStopMatched) hasHardStop = true;

    matchedRules.push({
      id: rule.id,
      category: rule.category,
      statement: rule.statement,
      enforcement: rule.enforcement,
      learned: rule.status === "active",
      weight: appliedWeight,
      riskFloor: appliedRiskFloor,
      declaredWeight: rule.weight,
      declaredRiskFloor: rule.riskFloor,
      hardStop: rule.hardStop === true,
      hardStopTriggered: hardStopMatched,
      affectsRisk,
      matchedOn: [
        ...explicitId.map((id) => `rule:${id}`),
        ...keywords.map((keyword) => `keyword:${keyword}`),
        ...paths.map((fileMatch) => `path:${fileMatch}`),
        ...hardStopTriggers.map(
          (trigger) =>
            `trigger:${trigger.index};actions=${trigger.actionHits.join("|")};targets=${trigger.targetHits.join("|")};requested=${trigger.requestedActions.join("|") || "no"}`,
        ),
      ],
      requires: appliedRequires ?? [],
      sources: rule.sources ?? [],
      validation: rule.validation ?? [],
    });
  }

  let baseScore;
  let baseReason;
  if (intent.operation === "read-only") {
    baseScore = 0;
    baseReason = "Explicit analysis framing with no execution connector.";
  } else if (intent.harmlessQualified) {
    baseScore = 15;
    baseReason = intent.docsOnly
      ? "Documentation-only files with no non-harmless action signal."
      : `Low-risk presentation signal: ${intent.lowRiskSignals.join(", ")}.`;
  } else {
    baseScore = 30;
    baseReason = "Unknown or behavior-changing work defaults to R2.";
  }

  const escalators = [];
  if (intent.operation === "change") {
    for (const escalator of rulebook.escalators ?? []) {
      const keywords = matchingPhrases(escalator.keywords, normalizedRequest);
      if (keywords.length === 0) continue;
      escalators.push({
        id: escalator.id,
        when: escalator.when,
        weight: escalator.weight,
        riskFloor: escalator.riskFloor,
        matchedOn: keywords.map((keyword) => `keyword:${keyword}`),
      });
      riskFloor = highestRisk(riskFloor, escalator.riskFloor);
    }

    if (normalizedFiles.length > 15) {
      const existingWide = escalators.find((entry) => entry.id === "ESC-WIDE");
      if (existingWide) {
        existingWide.matchedOn.push(`files:${normalizedFiles.length}`);
      } else {
        const wide = rulebook.escalators?.find(
          (entry) => entry.id === "ESC-WIDE",
        );
        escalators.push({
          id: "ESC-WIDE",
          when: `${normalizedFiles.length} proposed files`,
          weight: wide?.weight ?? 15,
          riskFloor: wide?.riskFloor ?? "R2",
          matchedOn: [`files:${normalizedFiles.length}`],
        });
        riskFloor = highestRisk(riskFloor, wide?.riskFloor ?? "R2");
      }
    }
  }

  const escalatorAdjustment = Math.min(
    20,
    escalators.reduce((total, escalator) => total + escalator.weight, 0),
  );
  let totalScore = Math.max(baseScore, maximumRuleWeight) + escalatorAdjustment;
  totalScore = hasHardStop
    ? Math.min(100, Math.max(80, totalScore))
    : Math.min(79, totalScore);

  const scoredClass = bandForScore(rulebook, totalScore).class;
  let riskClass = highestRisk(scoredClass, riskFloor);
  if (hasHardStop) riskClass = "R4";
  const minimumForRisk =
    bandForClass(rulebook, riskClass)?.minScore ?? totalScore;
  totalScore = Math.max(totalScore, minimumForRisk);
  const band = bandForClass(rulebook, riskClass);

  matchedRules.sort(
    (first, second) =>
      Number(second.hardStopTriggered) - Number(first.hardStopTriggered) ||
      Number(second.affectsRisk) - Number(first.affectsRisk) ||
      second.weight - first.weight ||
      first.id.localeCompare(second.id),
  );

  const autonomy = rulebook.autonomyCeiling[riskClass];
  const applicableRules = matchedRules.filter((rule) => rule.affectsRisk);

  return {
    rulebookVersion: rulebook.version,
    request: String(request ?? ""),
    files: normalizedFiles,
    operation: intent.operation,
    baseScore,
    baseReason,
    maximumRuleWeight,
    escalatorAdjustment,
    totalScore,
    band: band.label,
    riskClass,
    riskFloor,
    autonomyCeiling: autonomy.level,
    autonomyNote: autonomy.note,
    gates: rulebook.gates[riskClass],
    checks: checksFor(
      rulebook,
      intent.operation,
      normalizedFiles,
      matchedRules,
    ),
    requiredControls: unique(applicableRules.flatMap((rule) => rule.requires)),
    matchedRules,
    escalators,
    blocked: riskClass === "R4",
    approvalRequiredBeforeImplementation:
      riskClass === "R3" || riskClass === "R4",
    mayImplementNow:
      intent.operation === "change" &&
      RISK_ORDER.indexOf(riskClass) <= RISK_ORDER.indexOf("R2"),
    planningRecordMayBeWritten:
      intent.operation === "change" && riskClass !== "R4",
    notes: [
      ...(intent.operation === "read-only" && matchedRules.length > 0
        ? [
            "Matched domain rules are context only; read-only analysis does not mutate protected state.",
          ]
        : []),
      ...(matchedRules.length === 0 && intent.operation === "change"
        ? ["No specific rule matched, so the conservative R2 baseline applies."]
        : []),
      ...(intent.looksLikeQuestion && intent.operation === "change"
        ? [
            "A question mark alone does not make an execution request read-only.",
          ]
        : []),
      "The calculator is triage support. Code evidence and exact paths may only raise the class.",
    ],
  };
}

export const score = scoreRequest;

export function createDigest(rulebook = loadRulebook()) {
  assertValidRulebook(rulebook);
  const enforcementCounts = Object.fromEntries(
    ENFORCEMENT_STATES.map((state) => [
      state,
      rulebook.rules.filter((rule) => rule.enforcement === state).length,
    ]),
  );
  const lines = [
    `# PropertyGoJB business rules (v${rulebook.version}, ${rulebook.updatedAt})`,
    `Policy: ${rulebook.policy}`,
    `Base rules: ${rulebook.rules.length}; enforcement: ${Object.entries(
      enforcementCounts,
    )
      .map(([state, count]) => `${state}=${count}`)
      .join(", ")}`,
    "",
  ];
  for (const rule of rulebook.rules) {
    lines.push(
      `- [${rule.id}] (${rule.riskFloor}, w${rule.weight}, ${rule.enforcement}${rule.hardStop ? ", HARD STOP" : ""}) ${rule.statement}`,
    );
  }
  if ((rulebook.learnedRules ?? []).length > 0) {
    lines.push("", "## Learned rules");
    for (const rule of rulebook.learnedRules) {
      lines.push(`- [${rule.id}] (${rule.status}) ${rule.statement}`);
    }
  } else {
    lines.push("", "Learned rules: none.");
  }
  return lines.join("\n");
}

export function formatReport(result) {
  const out = [
    "",
    `SDLC RISK  ${result.totalScore} -> ${result.riskClass} (${result.band})`,
    `Intent     ${result.operation}`,
    `Autonomy   ${result.autonomyCeiling} - ${result.autonomyNote}`,
    `Basis      ${result.baseReason} Max rule ${result.maximumRuleWeight}; escalators +${result.escalatorAdjustment}.`,
  ];

  if (result.riskClass === "R3") {
    out.push(
      "",
      "R3 GATE: planning/work-item records may be written; obtain explicit approval before implementation edits.",
    );
  }
  if (result.blocked) {
    out.push(
      "",
      "R4 STOP: chat advice and a human-run plan only. The agent must not write repository files or execute the restricted action.",
    );
  }

  out.push("", "Matched business rules:");
  if (result.matchedRules.length === 0) {
    out.push("  (none; unknown mutations remain R2)");
  }
  for (const rule of result.matchedRules) {
    const mode = rule.affectsRisk ? "risk" : "context";
    const restriction = rule.hardStopTriggered
      ? " HARD STOP"
      : rule.hardStop
        ? " restricted-action context"
        : "";
    out.push(
      `  [${rule.id}] ${rule.riskFloor} w${rule.weight} ${rule.enforcement} ${mode}${restriction}`,
    );
    out.push(`    ${rule.statement}`);
    out.push(`    via ${rule.matchedOn.join(", ")}`);
  }

  if (result.escalators.length > 0) {
    out.push("", `Escalators (combined adjustment capped at +20):`);
    for (const escalator of result.escalators) {
      out.push(
        `  +${escalator.weight} [${escalator.id}] floor ${escalator.riskFloor}: ${escalator.when}`,
      );
    }
  }

  out.push("", "Required gates:");
  for (const gate of result.gates) out.push(`  - ${gate}`);
  if (result.requiredControls.length > 0) {
    out.push("", "Required controls:");
    for (const control of result.requiredControls) out.push(`  - ${control}`);
  }
  out.push("", "Required checks:");
  for (const check of result.checks) out.push(`  - ${check}`);
  out.push("", "Notes:");
  for (const note of result.notes) out.push(`  - ${note}`);
  out.push("");
  return out.join("\n");
}

function helpText() {
  return `PropertyGoJB Agentic SDLC weightage calculator

Usage:
  node scripts/sdlc-score.mjs --request "<plain-language request>"
  node scripts/sdlc-score.mjs --request "<request>" --files a.ts,b.ts
  node scripts/sdlc-score.mjs --changed --request "<request>"
  node scripts/sdlc-score.mjs --json --request "<request>"
  node scripts/sdlc-score.mjs --digest
  node scripts/sdlc-score.mjs --validate

Positional request text remains supported. Use --changed only when the whole current
worktree is intentionally in scope; otherwise pass the proposed files explicitly.
`;
}

export function parseArgs(argv) {
  const result = {
    requestParts: [],
    files: [],
    json: false,
    digest: false,
    validate: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--json") result.json = true;
    else if (argument === "--digest") result.digest = true;
    else if (argument === "--validate") result.validate = true;
    else if (argument === "--help" || argument === "-h") result.help = true;
    else if (argument === "--changed")
      result.files.push(...changedFilesFromGit());
    else if (argument === "--request") {
      const value = argv[index + 1];
      if (
        value === undefined ||
        value.trim() === "" ||
        value.startsWith("--")
      ) {
        throw new Error("--request requires a non-option value.");
      }
      result.requestParts.push(value);
      index += 1;
    } else if (argument === "--files") {
      const value = argv[index + 1];
      if (
        value === undefined ||
        value.trim() === "" ||
        value.startsWith("--")
      ) {
        throw new Error("--files requires a comma-separated non-option value.");
      }
      const parsedFiles = value
        .split(",")
        .map((file) => normalizeFilePath(file))
        .filter(Boolean);
      if (parsedFiles.length === 0) {
        throw new Error("--files requires at least one file path.");
      }
      result.files.push(...parsedFiles);
      index += 1;
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      result.requestParts.push(argument);
    }
  }

  result.request = result.requestParts.join(" ").trim();
  result.files = unique(
    result.files.map((file) => normalizeFilePath(file)).filter(Boolean),
  );
  return result;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${helpText()}`);
    process.exitCode = 1;
    return;
  }

  if (args.help) {
    process.stdout.write(helpText());
    return;
  }

  try {
    const rulebook = loadRulebook();
    if (args.validate) {
      const validation = validateRulebook(rulebook);
      if (args.json) {
        process.stdout.write(`${JSON.stringify(validation, null, 2)}\n`);
      } else if (validation.valid) {
        process.stdout.write(
          `Business-rule registry is valid: ${validation.counts.baseRules} base, ${validation.counts.activeLearnedRules} active learned, ${validation.counts.proposedLearnedRules} proposed.\n`,
        );
        for (const warning of validation.warnings) {
          process.stdout.write(`Warning: ${warning}\n`);
        }
      } else {
        process.stderr.write("Business-rule registry is invalid:\n");
        for (const error of validation.errors)
          process.stderr.write(`- ${error}\n`);
      }
      if (!validation.valid) process.exitCode = 1;
      return;
    }

    if (args.digest) {
      process.stdout.write(`${createDigest(rulebook)}\n`);
      return;
    }

    if (!args.request) {
      process.stderr.write(helpText());
      process.exitCode = 1;
      return;
    }

    const result = scoreRequest(args.request, args.files, { rulebook });
    process.stdout.write(
      args.json ? `${JSON.stringify(result, null, 2)}\n` : formatReport(result),
    );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(modulePath)
) {
  main();
}
