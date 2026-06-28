# Architecture

DiligenceOS separates the product workflow into UI, API, agent orchestration, tool contracts, policy checks, and operational controls.

```text
React workbench
  -> Express API
  -> Runtime controls and structured errors
  -> Agent loop
  -> Policy guardrails
  -> Evidence, risk, compliance, and memo tools
  -> Persisted trace
```

## Agent Loop

1. Observe the submitted deal profile and user goal.
2. Classify policy risk before any tool execution.
3. Select deterministic tools for evidence, finance, security, compliance, and memo drafting.
4. Validate each tool output before using it downstream.
5. Produce a memo with citations, risk posture, approval routing, and next actions.

## Boundaries

- The default runtime is deterministic and dry-run.
- Tool outputs are structured JSON and validated in code.
- Approval requirements are computed, not implied by UI copy.
- Local trace JSON files are ignored except for `traces/.gitkeep`.
