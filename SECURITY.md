# Security Policy

This repository is a portfolio-grade demo and does not process real confidential diligence data by default.

## Reporting

Open a GitHub issue for non-sensitive security concerns. Do not include secrets, private data-room documents, or production credentials.

## Defaults

- External writes are dry-run only.
- Security headers and request IDs are installed for every API response.
- Unsafe instructions are blocked before tool execution.
- `.env` and local trace JSON files are ignored by Git.
