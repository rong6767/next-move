# Next Move

A personal job application workspace in English and Simplified Chinese. Save opportunities and full job descriptions, group roles by company, and keep applications, interview notes, and follow-ups in one place.

[简体中文](README.zh-CN.md)

## Features

- **Company groups:** expand a company to see its roles and application totals. Each role keeps its own JD, status, notes, and timeline.
- **Three views:** company groups, individual roles, and a status board. Search includes saved JD text; filters, sorting, and pagination help with larger lists.
- **Application progress:** track saved, ready, applied, screening, interviewing, offer, rejected, and withdrawn states. Record the actual application date and resume version.
- **Follow-ups:** add a next action and date; see overdue, due-today, and upcoming items. Product dates use the America/Toronto time zone.
- **English / 中文:** switch the interface language without changing saved content. Language, view, and sort preferences are remembered in the browser.
- **Backups:** JSON retains complete records and timelines. CSV exports all matching results across pages, with headings and status labels in the current interface language.
- **dot collaboration:** a private Site MCP endpoint lets an authorized agent maintain the same records used by the website.

## Stack

React 19, TypeScript, Vinext/Vite, Cloudflare Workers, D1, Drizzle ORM, and the Sites hosting integration. ChatGPT sign-in supplies the user identity; database queries are scoped to that identity.

## Local development

Use Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by the server. The local preview supports the starter's simulated ChatGPT sign-in at `/signin-with-chatgpt?return_to=/`. Production sign-in is managed by Sites.

```sh
npm run check:types
npm run check:i18n
npm run build
```

The build produces the Worker and client assets in `dist/`. `npm start` serves the production build locally. Generate a migration after changing the database schema with `npm run db:generate`.

## Data and agent behavior

Job descriptions, company names, notes, tags, source text, and existing timeline entries remain in their original language. Switching the interface does not rewrite records. Status and priority values remain stable API identifiers in both languages.

Marking a role as applied records progress; it does not send an application to an employer. dot tools maintain records and do not submit applications or send messages. Follow-up dates appear in the workspace; unattended reminders require a separately configured automation.

JSON imports skip existing roles rather than overwriting them. Updates use record versions to detect concurrent changes. The application keeps archived roles recoverable.

## Source distribution and deployment

The GitHub distribution uses an empty candidate seed and excludes private runtime data, local databases, backups, credentials, and the live Site project binding. The website's existing private deployment retains its own binding and user data.

To deploy a separate copy with Sites, register its own Site and persist the returned project ID in `.openai/hosting.json` using the Sites workflow. Keep the `DB` D1 binding and `mcp` capability. Deploy schema migrations with the matching application version. Do not copy another deployment's identity or credentials.

The repository preserves the real development dates of the original source snapshots; distribution commit hashes differ where personal seed data or deployment identity was removed. See `docs/source-history.md` in the GitHub distribution.
