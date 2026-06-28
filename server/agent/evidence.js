export const evidenceCorpus = [
  {
    id: "DOC-101",
    title: "ARR bridge and cohort retention",
    source: "finance/arr-bridge-q2.md",
    sector: "fintech",
    trust: "board-pack",
    text: "ARR grew 42 percent year over year. Net revenue retention is 121 percent. Three enterprise customers represent 38 percent of ARR."
  },
  {
    id: "DOC-204",
    title: "Security questionnaire",
    source: "security/vendor-questionnaire.json",
    sector: "fintech",
    trust: "management-response",
    text: "SOC 2 Type II is in progress. Production data is hosted in us-east-1. SSO is deployed for internal users. DPA is signed with subprocessors."
  },
  {
    id: "DOC-311",
    title: "Customer concentration memo",
    source: "commercial/customer-concentration.md",
    sector: "fintech",
    trust: "sales-ops",
    text: "Largest customer contributes 18 percent of ARR. Top five customers contribute 49 percent. Renewal risk is elevated for two accounts."
  },
  {
    id: "DOC-418",
    title: "Regulatory posture",
    source: "legal/regulatory-posture.md",
    sector: "healthcare",
    trust: "counsel",
    text: "HIPAA policies are drafted. BAAs are complete for analytics vendors. Penetration test remediation is 70 percent complete."
  },
  {
    id: "DOC-512",
    title: "AI governance appendix",
    source: "governance/ai-controls.md",
    sector: "ai",
    trust: "risk-team",
    text: "Model outputs are logged. Human approval is required before customer-facing automated decisions. Prompt injection tests are monthly."
  },
  {
    id: "DOC-621",
    title: "Procurement risk notes",
    source: "procurement/vendor-risk.md",
    sector: "ai",
    trust: "procurement",
    text: "Critical dependency has no source-code escrow. Vendor offers 99.9 percent SLA. Incident notification target is 48 hours."
  }
];

export function searchEvidence({ query, sector }) {
  const terms = String(query || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const selected = evidenceCorpus
    .map((item) => {
      const haystack = `${item.title} ${item.text} ${item.sector}`.toLowerCase();
      const sectorBoost = sector && item.sector === sector ? 2 : 0;
      const score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), sectorBoost);
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return selected.length ? selected : evidenceCorpus.slice(0, 3).map((item) => ({ ...item, score: 0 }));
}
