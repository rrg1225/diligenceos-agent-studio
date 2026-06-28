# Contributing

## Local Checks

Run the same checks used by CI:

```bash
npm run ci:local
```

## Review Expectations

- Keep agent tools narrow and auditable.
- Add or update eval scenarios when the agent loop changes.
- Preserve dry-run defaults for any tool that could imply external writes.
- Update README or docs when API contracts change.
