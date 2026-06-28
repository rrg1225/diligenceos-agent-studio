# DiligenceOS Agent Studio

[![CI](https://github.com/rrg1225/diligenceos-agent-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/rrg1225/diligenceos-agent-studio/actions/workflows/ci.yml)
![Agent](https://img.shields.io/badge/AI-Agent%20Due%20Diligence-1D3557)
![Guardrails](https://img.shields.io/badge/Guardrails-HITL%20Approvals-2A9D8F)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

DiligenceOS Agent Studio is a full-stack AI agent workspace for investment, procurement, and partnership due diligence. It turns a deal request into an evidence-backed risk memo through a deterministic observe -> decide -> act -> validate -> handoff loop, with tool permissions, policy guardrails, approval gates, persisted audit traces, and scenario evals.

## Highlights

- Evidence retrieval over a seeded data-room corpus with citations.
- Deterministic agent loop with explicit state, tool calls, validation, and stop conditions.
- Risk scoring across finance, security, compliance, customer concentration, and execution signals.
- Human-in-the-loop approval routing for high-risk or high-value cases.
- Policy guardrails that block fabrication, approval bypass, and destructive instructions.
- React workbench for deal inputs, risk posture, evidence packs, memo output, and trace inspection.
- Express API with request IDs, browser security headers, structured errors, runtime metrics, and scorecard.
- API tests plus scenario evals that cover safe, high-risk, and unsafe requests.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API defaults to `http://localhost:4620`.

## Scripts

```bash
npm test       # API contracts plus scenario evals
npm run eval   # deterministic agent scenario suite
npm run build  # production React bundle
npm run start  # serve API and built frontend
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service health and provider mode |
| `GET` | `/api/tools` | Agent tool catalog and permissions |
| `GET` | `/api/evidence` | Seeded evidence corpus |
| `GET` | `/api/metrics/runtime` | Runtime request and status metrics |
| `GET` | `/api/metrics/scorecard` | Operational readiness score and checks |
| `POST` | `/api/runs` | Execute a due diligence agent run and persist trace |

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4620` | Express API port |
| `AGENT_MODE` | `dry-run` | Agent execution mode |
| `OPENAI_API_KEY` | empty | Optional future provider key; deterministic mode works without it |
| `DATA_ROOM_ROOT` | `./data-room` | Optional data-room mount path for future adapters |

## Quality Gates

- `npm test` verifies API contracts, guardrails, scorecard output, and eval scenarios.
- `npm run eval` replays realistic low-risk, high-risk, and unsafe diligence requests.
- `npm run build` validates the production React bundle.
- GitHub Actions runs the local CI chain on pull requests and `main`.

## Portfolio Positioning

This project is built to demonstrate production-grade agent engineering: narrow tool contracts, permission-aware orchestration, grounded output, auditability, human approval gates, operational telemetry, and regression evals. It runs without external services, but the architecture leaves clear extension points for document ingestion, vector search, LLM providers, and workflow systems.
