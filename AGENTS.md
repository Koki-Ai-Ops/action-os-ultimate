# Codex operating rules — 集客整理帳

## Mission
Finish and verify the existing 集客整理帳 product before adding new features. Preserve the current public behavior unless a requested change clearly requires otherwise.

## Product
- Static HTML/CSS/JavaScript product for small shops.
- Main app source lives under `site/`.
- Current production URL and release notes are documented in `README.md`.
- Browser-local storage is user state; do not invent a backend or account system unless explicitly requested.

## Priority order
1. Broken behavior and regressions.
2. Mobile usability and accessibility.
3. Data-loss or localStorage safety.
4. Release/test reliability.
5. Copy and UX clarity.
6. New features only after the above are healthy.

## Execution rules
- Inspect the repository before editing.
- Reuse existing files and patterns; do not rebuild from scratch.
- Make the smallest change that solves the verified problem.
- Do not add paid services, external APIs, analytics, trackers, login, or databases without explicit approval.
- Never commit secrets, tokens, API keys, private contact data, or customer data.
- Keep the static deployment model unless explicitly asked to change it.
- Do not change `main` directly for material work; use a branch and PR.
- Do not claim deployment or browser behavior is verified unless a tool/test confirms it.

## Required checks
For material code changes:
1. Run the existing static audit.
2. Run the existing browser E2E test.
3. Inspect the changed page in a browser when available.
4. Check for console errors and mobile-width regressions.
5. Re-run relevant checks after fixes.

## Definition of DONE
A task is DONE only when:
- requested changes exist,
- relevant checks pass or the exact blocker is documented,
- existing behavior was not unintentionally removed,
- the public deployment path remains valid,
- remaining human action, if any, is explicit and minimal.
