# Source history

This sanitized source distribution was prepared on 2026-10-20 (America/Toronto) from three existing committed snapshots of the Next Move Site.

The three reconstructed historical commits preserve each original author's name, email, timestamp, and each original committer's name, email, timestamp. Their historical dates describe the original development stages; they do not claim that this sanitized GitHub mirror was prepared on those dates. Sanitization and clarified messages necessarily produce new commit hashes. The original snapshot IDs below identify the source evidence and are not the new repository's commit IDs.

## Original snapshots

- Original snapshot `2862b7975eed4fe597c76e1d73690bd8ac6c431f`: Initial job application workspace, persistent per-user records, JD snapshots, progress history, and MCP tools.
  - Author time: `2026-10-12T13:59:14-04:00`.
  - Committer time: `2026-10-12T13:59:14-04:00`.
- Original snapshot `714ad449f141e304fb8f269cfbe5eb966ec6c027`: Drawer footer and mobile safe-area spacing refinements; the original change added two CSS rules.
  - Author time: `2026-10-12T14:13:16-04:00`.
  - Committer time: `2026-10-12T14:13:16-04:00`.
- Original snapshot `f5bc5170edf6e9ba83708c6036c40f943bb3aaf0`: Company-grouped opportunities, per-company role browsing, search and sorting, pagination, and browsing refinements.
  - Author time: `2026-10-14T19:12:13-04:00`.
  - Committer time: `2026-10-14T19:12:13-04:00`.

## Sanitization applied to every historical snapshot

- Replace the personal candidate shortlist with an empty `lib/seed-jobs.json`; keep imports compatible without distributing personal job-search preferences or archived JD content.
- Omit the original `project_id` from `.openai/hosting.json`, retaining only the logical D1/R2 bindings and MCP capabilities.
- Omit TypeScript build metadata, environment files, credential/key material, runtime databases, local agent state, generated output, deployment archives, and local dependencies.
- Replace the personal fallback display name with a generic label, and describe the empty distributed dataset in the product README.
- Keep runtime database schema and migration files: these define structure and contain no personal application rows.

English-language features and subsequent work belong in later commits with their actual preparation dates. The original private Sites source repository and its working tree are unchanged by this reconstruction.

## 2026-10-20: bilingual interface and distribution documentation

The English-language work was prepared as three new commits using the actual system author and committer times, without overriding dates:

1. Add persistent English and Chinese locale support: locale provider, stable status and priority labels, Toronto-aware date formatting, server-error translations, layout integration, and an i18n verification script.
2. Localize the job workspace and company views: language switching, forms, company groups, reminders, board and list views, CSV labels, and responsive controls.
3. Document bilingual setup and verification: English and Chinese READMEs, verification commands, and these source-history notes.

Verification completed for the matching bilingual Sites source before distribution:

- TypeScript checks, automated i18n checks, and the production build passed.
- Browser verification confirmed that the language preference survives reload.
- Saved JD text and existing job content remain unchanged when the interface language changes.
- CSV exports use English column headings when English is selected.
- A 390 px mobile viewport showed no horizontal overflow.

These application files are copied into this sanitized mirror; this note records the completed Sites-source validation rather than claiming a separate dependency installation or browser session in the mirror. The distributed seed remains empty, the original Site project ID remains absent, and private runtime data stays excluded.
