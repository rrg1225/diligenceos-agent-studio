# Operations

## Health

- `GET /api/health`
- `GET /api/metrics/runtime`
- `GET /api/metrics/scorecard`

## Runbook

1. Run `npm run ci:local` before publishing.
2. Inspect `traces/` locally when evals or runs regress.
3. Keep `.env` out of Git.
4. Add evals for new sectors, new tools, or changed approval policy.

## Extension Points

- Replace seeded evidence with a document ingestion pipeline.
- Add vector retrieval behind `evidence.search`.
- Add provider-backed memo drafting while preserving deterministic eval fixtures.
- Connect approval handoffs to Slack, Jira, Linear, or a CRM as dry-run tools first.
