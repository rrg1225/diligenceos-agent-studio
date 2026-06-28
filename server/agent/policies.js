const unsafePatterns = [
  /fabricate|make up|invent evidence/i,
  /hide|remove|delete .*evidence/i,
  /bypass approval|skip approval|ignore policy/i,
  /guarantee return|guaranteed return/i,
  /leak|secret|private key|credential/i
];

export function classifyRequest(input) {
  const text = JSON.stringify(input || {});
  const matched = unsafePatterns.find((pattern) => pattern.test(text));
  if (matched) {
    return {
      level: "blocked",
      reason: "Unsafe diligence instruction detected before tool execution.",
      matched: matched.source
    };
  }

  if (/acquire|investment|term sheet|procurement|vendor/i.test(text)) {
    return { level: "review", reason: "Diligence request requires evidence-backed human review." };
  }

  return { level: "standard", reason: "Standard evidence-backed analysis request." };
}

export function validateToolOutput(tool, output) {
  if (!output || typeof output !== "object") return false;
  if (tool === "evidence.search") return Array.isArray(output.citations) && output.citations.length > 0;
  if (tool === "finance.score") return Number.isFinite(output.riskScore) && output.riskScore >= 0;
  if (tool === "security.review") return Array.isArray(output.findings);
  if (tool === "compliance.check") return Array.isArray(output.controls);
  if (tool === "memo.compose") return typeof output.summary === "string" && Array.isArray(output.citations);
  return false;
}

export function approvalPolicy(profile, risk) {
  const dealSize = Number(profile.dealSizeUsd || 0);
  const tolerance = profile.riskTolerance || "balanced";
  const threshold = tolerance === "aggressive" ? 78 : tolerance === "conservative" ? 55 : 65;
  const requiresApproval = risk.riskScore >= threshold || dealSize >= 1000000 || risk.redFlags.length > 0;
  return {
    requiresApproval,
    threshold,
    route: requiresApproval ? ["investment-lead", "security-review", "legal-review"] : ["deal-owner"],
    reason: requiresApproval ? "Risk or deal size exceeds auto-clear policy." : "Risk stays within auto-clear policy."
  };
}
