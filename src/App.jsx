import { useEffect, useMemo, useState } from "react";

const examples = [
  {
    label: "Fintech Series B",
    profile: {
      company: "Northstar Analytics",
      sector: "fintech",
      dealSizeUsd: 2500000,
      riskTolerance: "balanced",
      ask: "Assess Northstar Analytics for an investment committee memo focused on ARR quality, customer concentration, and security posture."
    }
  },
  {
    label: "AI vendor review",
    profile: {
      company: "VectorForge AI",
      sector: "ai",
      dealSizeUsd: 680000,
      riskTolerance: "conservative",
      ask: "Review VectorForge AI as a critical vendor for procurement approval with focus on governance and dependency risk."
    }
  },
  {
    label: "Healthcare partner",
    profile: {
      company: "CareLoop Systems",
      sector: "healthcare",
      dealSizeUsd: 940000,
      riskTolerance: "conservative",
      ask: "Prepare a partnership diligence memo for CareLoop Systems with HIPAA, BAA, and remediation evidence."
    }
  }
];

export default function App() {
  const [profile, setProfile] = useState(examples[0].profile);
  const [run, setRun] = useState(null);
  const [tools, setTools] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadMetadata() {
    const [toolsResponse, scorecardResponse] = await Promise.all([
      fetch("/api/tools"),
      fetch("/api/metrics/scorecard")
    ]);
    setTools(await toolsResponse.json());
    setScorecard(await scorecardResponse.json());
  }

  useEffect(() => {
    loadMetadata();
  }, []);

  async function execute(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Run failed");
      setRun(payload);
      await loadMetadata();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const phaseCounts = useMemo(() => {
    return (run?.trace || []).reduce((result, item) => {
      result[item.phase] = (result[item.phase] || 0) + 1;
      return result;
    }, {});
  }, [run]);

  const memo = run?.final?.memo;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">Diligence agent workspace</span>
          <h1>DiligenceOS Agent Studio</h1>
        </div>
        <div className="score-pill">
          <strong>{scorecard?.grade || "-"}</strong>
          <span>Ops score</span>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="workspace">
        <form className="panel form-panel" onSubmit={execute}>
          <div className="section-head">
            <h2>Deal profile</h2>
            <span>{profile.riskTolerance}</span>
          </div>
          <label>
            Company
            <input value={profile.company} onChange={(event) => setProfile({ ...profile, company: event.target.value })} />
          </label>
          <div className="two-col">
            <label>
              Sector
              <select value={profile.sector} onChange={(event) => setProfile({ ...profile, sector: event.target.value })}>
                <option value="fintech">Fintech</option>
                <option value="ai">AI</option>
                <option value="healthcare">Healthcare</option>
              </select>
            </label>
            <label>
              Deal size
              <input
                type="number"
                value={profile.dealSizeUsd}
                onChange={(event) => setProfile({ ...profile, dealSizeUsd: Number(event.target.value) })}
              />
            </label>
          </div>
          <label>
            Risk tolerance
            <select
              value={profile.riskTolerance}
              onChange={(event) => setProfile({ ...profile, riskTolerance: event.target.value })}
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>
          <label>
            Diligence ask
            <textarea value={profile.ask} onChange={(event) => setProfile({ ...profile, ask: event.target.value })} />
          </label>
          <div className="example-grid">
            {examples.map((example) => (
              <button type="button" className="secondary" key={example.label} onClick={() => setProfile(example.profile)}>
                {example.label}
              </button>
            ))}
          </div>
          <button type="submit" disabled={loading}>{loading ? "Running..." : "Run diligence agent"}</button>
        </form>

        <aside className="panel">
          <div className="section-head">
            <h2>Tool permissions</h2>
            <span>{tools.length} tools</span>
          </div>
          <div className="tool-list">
            {tools.map((tool) => (
              <article key={tool.name}>
                <strong>{tool.name}</strong>
                <span>{tool.permission}</span>
                <p>{tool.description}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      {run && (
        <section className="results">
          <div className="panel memo-panel">
            <div className="section-head">
              <h2>Committee memo</h2>
              <span className={`status ${run.status}`}>{run.status}</span>
            </div>
            <p className="memo-summary">{memo.summary}</p>
            <div className="metric-grid">
              <Metric label="Risk score" value={run.final.quality.riskScore} />
              <Metric label="Evidence" value={run.final.quality.citedEvidence} />
              <Metric label="Validated" value={run.final.quality.validatedTools} />
              <Metric label="Writes" value={run.final.quality.externalWrites} />
            </div>
            <h3>Recommendation</h3>
            <p>{memo.recommendation}</p>
            <h3>Next actions</h3>
            <ul>
              {memo.nextActions.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <div className="panel">
            <div className="section-head">
              <h2>Evidence pack</h2>
              <span>{memo.citations.length} citations</span>
            </div>
            <div className="citation-list">
              {memo.citations.map((citation) => (
                <article key={citation.id}>
                  <strong>{citation.id} · {citation.title}</strong>
                  <span>{citation.source}</span>
                  <p>{citation.excerpt}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="panel trace-panel">
            <div className="section-head">
              <h2>Trace</h2>
              <span>{run.trace.length} events</span>
            </div>
            <div className="phase-grid">
              {Object.entries(phaseCounts).map(([phase, count]) => <Metric key={phase} label={phase} value={count} />)}
            </div>
            {run.trace.map((item, index) => (
              <article key={`${item.phase}-${item.step}-${index}`}>
                <span>{item.step}</span>
                <div>
                  <strong>{item.phase}</strong>
                  <pre>{JSON.stringify(item, null, 2)}</pre>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
