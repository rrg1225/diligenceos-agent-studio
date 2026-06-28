import { randomUUID } from "node:crypto";
import { classifyRequest, validateToolOutput } from "./policies.js";
import { runTool } from "./tools.js";

export async function runDiligenceAgent(profile, options = {}) {
  const normalized = normalizeProfile(profile);
  const state = {
    runId: `run_${Date.now()}_${randomUUID().slice(0, 8)}`,
    startedAt: new Date().toISOString(),
    mode: options.mode || process.env.AGENT_MODE || "dry-run",
    maxSteps: clampSteps(options.maxSteps || process.env.AGENT_MAX_STEPS || 8),
    profile: normalized,
    ask: normalized.ask,
    policy: null,
    observations: [],
    trace: [],
    evidenceText: "",
    status: "running"
  };

  state.policy = classifyRequest(normalized);
  state.trace.push(event(1, "observe", { profile: normalized, policy: state.policy }));
  if (state.policy.level === "blocked") return finish(state, "blocked", state.policy.reason);

  const sequence = ["evidence.search", "finance.score", "security.review", "compliance.check", "memo.compose"];
  for (let index = 0; index < Math.min(sequence.length, state.maxSteps); index += 1) {
    const tool = sequence[index];
    const startedAt = performance.now();
    state.trace.push(event(index + 2, "decide", { tool, reason: reasonFor(tool) }));

    const output = await runTool(tool, { profile: normalized }, state);
    if (tool === "evidence.search") {
      state.evidenceText = output.citations.map((citation) => citation.excerpt).join(" ");
    }
    const observation = { tool, output, latencyMs: Math.round(performance.now() - startedAt) };
    state.observations.push(observation);
    state.trace.push(event(index + 2, "act", { observation }));

    const ok = validateToolOutput(tool, output);
    state.trace.push(event(index + 2, "validate", { tool, ok }));
    if (!ok) return finish(state, "failed", `Tool output failed validation: ${tool}`);
  }

  const memo = state.observations.find((item) => item.tool === "memo.compose")?.output;
  return finish(state, memo?.approval?.requiresApproval ? "needs-review" : "ready", "diligence_memo_ready");
}

function normalizeProfile(profile) {
  const company = String(profile.company || "Northstar Analytics").trim();
  const sector = String(profile.sector || "fintech").trim().toLowerCase();
  const ask = String(profile.ask || `Assess ${company} for investment committee review`).trim();
  return {
    company,
    sector,
    ask,
    dealSizeUsd: Number(profile.dealSizeUsd || 750000),
    riskTolerance: ["conservative", "balanced", "aggressive"].includes(profile.riskTolerance)
      ? profile.riskTolerance
      : "balanced"
  };
}

function reasonFor(tool) {
  const reasons = {
    "evidence.search": "Ground the run in cited data-room evidence.",
    "finance.score": "Quantify finance and commercial risk signals.",
    "security.review": "Review assurance, identity, data, and dependency posture.",
    "compliance.check": "Map risk to approval policy and control status.",
    "memo.compose": "Draft the dry-run committee memo with citations and next actions."
  };
  return reasons[tool];
}

function finish(state, status, reason) {
  state.status = status;
  state.completedAt = new Date().toISOString();
  state.durationMs = Math.max(0, Date.parse(state.completedAt) - Date.parse(state.startedAt));
  const evidence = state.observations.find((item) => item.tool === "evidence.search")?.output;
  const risk = state.observations.find((item) => item.tool === "finance.score")?.output;
  const memo = state.observations.find((item) => item.tool === "memo.compose")?.output;

  state.final = {
    status,
    reason,
    policy: state.policy,
    memo,
    committeeDecision: buildCommitteeDecision({ status, memo, evidence, risk }),
    quality: {
      citedEvidence: evidence?.citations?.length || 0,
      riskScore: risk?.riskScore || 0,
      approvalRequired: Boolean(memo?.approval?.requiresApproval),
      dryRunOnly: state.mode === "dry-run",
      externalWrites: state.observations.filter((item) => item.output?.externalWritePerformed).length,
      validatedTools: state.trace.filter((item) => item.phase === "validate" && item.ok).length
    }
  };
  return state;
}

function buildCommitteeDecision({ status, memo, evidence, risk }) {
  const evidenceCount = evidence?.citations?.length || 0;
  const approval = memo?.approval;
  const riskScore = risk?.riskScore || 0;
  const posture = risk?.posture || "unknown";
  const openRisks = risk?.redFlags || [];

  return {
    verdict: status === "blocked" ? "blocked" : approval?.requiresApproval ? "conditional-review" : "ready-to-advance",
    gate: approval?.gate || "policy",
    posture,
    riskScore,
    evidenceCoverage: evidenceCount >= 5 ? "strong" : evidenceCount >= 3 ? "sufficient" : "thin",
    openRiskCount: openRisks.length,
    oneLine:
      status === "blocked"
        ? "Request is blocked by policy before any tool execution."
        : `${posture} risk profile with ${evidenceCount} cited evidence items; ${approval?.requiresApproval ? "committee approval is required" : "standard follow-up is sufficient"}.`
  };
}

function event(step, phase, payload) {
  return { step, phase, at: new Date().toISOString(), ...payload };
}

function clampSteps(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 8;
  return Math.max(3, Math.min(10, Math.round(parsed)));
}
