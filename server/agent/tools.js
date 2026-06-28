import { searchEvidence } from "./evidence.js";
import { approvalPolicy } from "./policies.js";

export const toolCatalog = [
  {
    name: "evidence.search",
    permission: "read",
    description: "Searches the seeded data-room corpus and returns cited evidence snippets."
  },
  {
    name: "finance.score",
    permission: "analyze",
    description: "Scores financial and commercial diligence risks from evidence and deal profile."
  },
  {
    name: "security.review",
    permission: "review",
    description: "Checks security posture, data handling, and vendor dependency risk."
  },
  {
    name: "compliance.check",
    permission: "review",
    description: "Maps diligence concerns to controls, approvals, and unresolved evidence."
  },
  {
    name: "memo.compose",
    permission: "write-dry-run",
    description: "Drafts a cited committee memo without external writes."
  }
];

export async function runTool(name, input, state) {
  const tools = {
    "evidence.search": evidenceSearch,
    "finance.score": financeScore,
    "security.review": securityReview,
    "compliance.check": complianceCheck,
    "memo.compose": memoCompose
  };
  const handler = tools[name];
  if (!handler) throw new Error(`unknown tool: ${name}`);
  return handler(input, state);
}

function evidenceSearch(input, state) {
  const matches = searchEvidence({ query: state.ask, sector: state.profile.sector });
  return {
    citations: matches.map((item) => ({
      id: item.id,
      title: item.title,
      source: item.source,
      trust: item.trust,
      excerpt: item.text
    })),
    coverage: matches.length >= 3 ? "sufficient" : "thin",
    externalWritePerformed: false
  };
}

function financeScore(_input, state) {
  const evidenceText = state.evidenceText;
  const redFlags = [];
  let riskScore = 24;

  if (/top five customers contribute 49 percent/i.test(evidenceText)) {
    riskScore += 18;
    redFlags.push("Customer concentration is material.");
  }
  if (/soc 2 type ii is in progress/i.test(evidenceText)) {
    riskScore += 12;
    redFlags.push("SOC 2 Type II is not complete.");
  }
  if (/renewal risk is elevated/i.test(evidenceText)) {
    riskScore += 14;
    redFlags.push("Renewal risk is elevated for named accounts.");
  }
  if (/source-code escrow/i.test(evidenceText)) {
    riskScore += 10;
    redFlags.push("Critical vendor dependency lacks escrow.");
  }
  if (/arr grew 42 percent/i.test(evidenceText)) riskScore -= 8;
  if (/net revenue retention is 121 percent/i.test(evidenceText)) riskScore -= 6;

  riskScore = Math.max(0, Math.min(100, riskScore));
  return {
    riskScore,
    posture: riskScore >= 75 ? "high" : riskScore >= 55 ? "medium" : "managed",
    redFlags,
    positiveSignals: ["ARR growth", "Net revenue retention", "Documented operating controls"],
    externalWritePerformed: false
  };
}

function securityReview(_input, state) {
  const evidenceText = state.evidenceText;
  const findings = [
    {
      area: "Identity",
      status: /sso is deployed/i.test(evidenceText) ? "controlled" : "unknown",
      note: "SSO posture is reviewed for internal access."
    },
    {
      area: "Assurance",
      status: /soc 2 type ii is in progress/i.test(evidenceText) ? "needs-follow-up" : "controlled",
      note: "SOC 2 completion date should be requested before closing."
    },
    {
      area: "Data",
      status: /hosted in us-east-1|baas are complete/i.test(evidenceText) ? "controlled" : "needs-follow-up",
      note: "Data residency and processor contracts are part of the evidence pack."
    }
  ];

  return {
    findings,
    unresolved: findings.filter((finding) => finding.status !== "controlled").length,
    externalWritePerformed: false
  };
}

function complianceCheck(_input, state) {
  const risk = state.observations.find((item) => item.tool === "finance.score")?.output || { riskScore: 0, redFlags: [] };
  const approval = approvalPolicy(state.profile, risk);
  return {
    approval,
    controls: [
      { id: "C-1", name: "Evidence citations required", status: "passing" },
      { id: "C-2", name: "No external writes during diligence", status: "passing" },
      { id: "C-3", name: "Human approval for high-risk decisions", status: approval.requiresApproval ? "required" : "cleared" }
    ],
    externalWritePerformed: false
  };
}

function memoCompose(_input, state) {
  const evidence = state.observations.find((item) => item.tool === "evidence.search")?.output;
  const risk = state.observations.find((item) => item.tool === "finance.score")?.output;
  const security = state.observations.find((item) => item.tool === "security.review")?.output;
  const compliance = state.observations.find((item) => item.tool === "compliance.check")?.output;
  const citations = evidence?.citations || [];
  const approval = compliance?.approval || approvalPolicy(state.profile, risk || { riskScore: 0, redFlags: [] });

  return {
    summary: `${state.profile.company} shows ${risk.posture} diligence risk with ${citations.length} cited evidence items.`,
    recommendation: approval.requiresApproval ? "Proceed only after review gates clear." : "Proceed with monitored diligence follow-ups.",
    approval,
    risks: risk.redFlags,
    securityFindings: security.findings,
    citations,
    nextActions: [
      "Request missing assurance documents and renewal-risk owner notes.",
      "Confirm customer concentration mitigation plan.",
      "Route memo to assigned approvers before any binding commitment."
    ],
    externalWritePerformed: false
  };
}
