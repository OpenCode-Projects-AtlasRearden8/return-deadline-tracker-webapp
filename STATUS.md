# STATUS.md — Return Deadline Tracker

Built: October 30, 2026 — by Asdale Dynamics, LLC

## What was built

An offline, zero-dependency web app for tracking missed-return-window dread, delivered as a **single file** (`index.html`) that runs from `file://` with no server, build step, or network.

Features:

- **Return item cards** — purchase date, store, return-policy length in days, price, notes, and a large at-a-glance countdown ("5 days left", "Last day today", "3 days past window") color-coded: green (calm), amber (last day / soon), red (window closed).
- **Library-book due rows** — title, branch, due date, countdown, returned/overdue/due-soon pills, mark-returned toggle, sort toggle.
- **Borrowed & lent items** — direction (borrowed-from / lent-to), person, loan date, optional "expected back" date, overdue counts, returned toggle.
- **Month-ahead nudge view** — every open deadline from today through the next ~2 months (61 days), grouped by month, sorted by date.
- **Printable return receipt checklist** — per-item checkboxes on the receipt tab plus a "select all" toggle; print output strips app chrome and shows only the checklist with static check-boxes and a blank "date on the trip" line. Reachable via the "Add to receipt" button on any return card.
- **CSV export** — four buttons: returns, library books, loans, and everything combined. Uses Blob + object URLs (works from `file://`).
- **Tools tab** — load sample data, erase-all (with confirmation), storage summary.
- **localStorage only** — key `return-deadline-tracker.v1`; no network calls, no analytics, no accounts. All user input is HTML-escaped before rendering.

## How to run it

Open `index.html` in any modern browser (double-click, or File → Open). Works fully offline from `file://`.

## How to test

```bash
node tests/countdown.test.js
```

## Verification results

- `node tests/countdown.test.js` → **PASS: 41 assertions, 0 failures** (2026-10-30). Tests extract the pure countdown-math block from `index.html` between the `COUNTDOWN-CORE-START` / `COUNTDOWN-CORE-END` markers and run it in a Node `vm` sandbox, so the shipped code is what gets tested. Coverage: date parsing (valid/invalid/leap days), `daysUntil` (same-day, forward, backward, month/year rollover, leap year, DST-proof), `addDays` (month/year/leap, zero, negative), `expiryDate` (30/90/365-day windows, 0-day, invalid), `statusFor` buckets, `countdownLabel` copy/verbs/singular-plural, `fmtDateHuman`, month helpers, and three end-to-end scenarios (return window, overdue book, two-week loan).
- Full inline script compiles cleanly via `node:vm` (syntax check, 23 KB of JS) — no syntax errors.
- All 34 element IDs referenced by the script were cross-checked against the DOM ids in the HTML; all exist.
- CSS brace balance verified.
- No build step exists (by design) and none is needed; opening the file in a browser is the runtime verification.
- Manual review pass over the app code: form validation, escaping, sort toggles, seed-confirm guard, print-path tab handling.

## Known gaps

- **No automated browser (DOM) test.** The app section runs only in a browser; there is no bundled jsdom/puppeteer (keeping the zero-dependency promise), so click-through behavior is verified by code review and the syntax/id checks above, not by headless end-to-end tests. Adding a `?selftest=1` self-test page would be a natural next step.
- **No CSV import.** Export only; adding import would round out device migration.
- **Receipt selection is session-only** (checkbox choices don't persist across reloads). Items marked via "Add to receipt" select by id.
- **Return windows are day-count based.** Conventional retail windows are treated as calendar days from purchase; stores that count business days or start from delivery date are not modeled.
- **Sample data** appends to (does not replace) existing entries, with a confirmation dialog; duplicates would then need manual removal.
- **Month-ahead window is fixed at 61 days** (~2 months), not a true calendar-month picker.
- **No reminder notifications** — nudges are visible-on-open only, consistent with the offline/no-sync promise.
- Transactions in stores don't track return fees/restocking policies or receipts' serial numbers — the notes field covers this manually.

## Files

```
index.html                  entire app (HTML + CSS + JS, single file, ~910 lines)
tests/countdown.test.js     plain-Node test runner for the countdown math
README.md                   usage + credits (Asdale Dynamics, LLC)
LICENSE                     MIT — Copyright (c) 2026 Asdale Dynamics, LLC
STATUS.md                   this file
```

Copyright (c) 2026 Asdale Dynamics, LLC — MIT licensed.
