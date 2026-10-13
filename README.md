# BGV Checker

A complete React Native + Expo + TypeScript **local demonstration app** for background-verification workflows, with responsive desktop dashboards and native-style mobile navigation.

## Included

- **Admin portal:** all candidates and organizations, case status management, document approval/change requests, checklist editing, reports, audit history, and workspace controls.
- **Client portal:** Acme Corporation's cases only, new verification creation, read-only documents, and scoped reports.
- **Candidate portal:** Olivia Rhye's own checklist, consent, real sample-file uploads, download/removal, progress, review feedback, and submission readiness.
- **14 reference-based check types / 29 initial document requirements.** The duplicate CV card in the reference is consolidated. Administrators can add checks, edit requirements, enable/disable checks, and mark checks required or optional. Added checks are assigned to existing cases as well as new cases.
- **Settings:** maintenance mode, portal access, document uploads, new cases, CSV exports, consent requirement, maximum upload size, workspace name, notifications, and dark/light/system appearance.
- Candidate search, filtering, pagination, client management, keyboard workspace search, charts, notification center, empty states, upload errors, modal flows, and accessible controls.
- State persisted with AsyncStorage. Actual file bytes are persisted in IndexedDB on web and the app's document directory on iOS/Android.
- Source archive downloadable from **Help & support → Download source code** in the web app.

## Important scope and privacy

This is **not a production verification service**. The demo deliberately opens the Admin portal and provides a role switcher to explore the three experiences. There is no authentication server, remote database, multi-device synchronization, encrypted document vault, external screening-provider integration, email delivery, or push notification service. Client-side role scoping is not a security boundary. Use sample files only, not real identity, credit, police, or health records.

Case progress and historical events are seeded fictional data. The dashboard uses a fixed demonstration reporting date of September 25, 2026. Charts aggregate seeded/new local cases by creation date. Tiny metric sparklines are decorative illustrations, not separate historical data series. Case approval is an administrator's local workflow action, not a certified background-check outcome. File consent is saved locally, not a legally auditable signed consent.

The supplied text files each contained one earlier deployment URL. All six were downloaded into `inputs/`; their linked deployments returned HTTP 403 during implementation. The supplied visual reference was reviewed locally but **is not embedded in the application**. Requirements were transcribed from the visible reference, with terminology normalized and a duplicate removed. Some labels were cut off or ambiguous, so screening consent/contact fields and indicative durations were reasonably inferred. This is not a claim of legal completeness or an independently verified current regulatory checklist. Have your screening provider and legal/privacy team approve it before real use.

## Run

```sh
npm ci
npm start
```

Use Expo's development client or the iOS/Android targets as appropriate for your environment. For web development: `npm run web`.

## Validate and build

```sh
npm run typecheck
npm run build                 # expo export --platform all
npx playwright install chromium
npm run test:e2e
```

The Playwright suite starts a short-lived static server for `dist/`, runs Chromium tests, and stops the server on completion. It exercises the actual exported application, including real file chooser events and download persistence. HTML output is in `playwright-report/`; screenshots and failure traces are in `test-results/`.

To test an already hosted deployment, set `PLAYWRIGHT_BASE_URL` before running the tests. Native iOS/Android bundles are exported, but Playwright tests the web UI at desktop and mobile viewport sizes, not a native simulator.

To build the downloadable source archive after export:

```sh
python scripts/package-source.py
```

## Source layout

```text
App.tsx                     Font loading, app providers, stack navigation, toasts
components/Shell.tsx        Responsive sidebar, bottom tabs, portal switcher
components/ui.tsx           Shared themed controls and modal primitives
components/charts.tsx       SVG charts
components/CandidateTable.tsx
components/NewCaseDialog.tsx
screens/Dashboard.tsx
screens/Candidates.tsx
screens/CaseDetails.tsx
screens/Checklist.tsx
screens/Clients.tsx
screens/Reports.tsx
screens/Settings.tsx
lib/data.ts                 Types, initial checklist, fictional seed data
lib/store.tsx               Persistent app state, theme, portal scoping
lib/files.ts                File vault, downloads, CSV escaping
lib/navigation.ts
playwright.config.ts
tests/app.spec.ts
tests/controls.spec.ts
tests/static-server.cjs
scripts/package-source.py
```

## Production handoff checklist

Before accepting real personal data:

1. Replace the demo role switcher with a trusted identity provider, invite flow, session expiry, and administrator MFA.
2. Enforce workspace, client, candidate, and action permissions **on every server request**, never only in UI code.
3. Replace local file persistence with private object storage, short-lived signed access, encryption, server-side MIME/content validation, malware scanning, and upload limits.
4. Move settings, case transitions, and audit events into a transactional backend with append-only audit records. Enforce document approval requirements server-side.
5. Apply approved jurisdiction-specific checklists, purpose-limited consent, retention/deletion policies, access logs, and controls for especially sensitive information.
6. Integrate an authorized screening provider. Do not interpret demo case status as an actual background-check result.
7. Connect transactional email/notifications, monitor errors, back up data, and test restore/revocation flows.
8. Configure your own Expo/EAS project and app-store signing. Run native simulator/device tests, security testing, dependency review, and accessibility testing before launch.

## Reset local demo data

On web, clear the site's local storage and the `bgv-document-vault` IndexedDB database in browser developer tools. On native, clear app data/reinstall the demo. Clearing local data is irreversible; there is no remote backup.
