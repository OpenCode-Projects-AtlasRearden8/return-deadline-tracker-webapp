# Return Deadline Tracker

An offline, zero-dependency web app for the quiet dread of missed return windows. Track store return windows with at-a-glance countdowns, library book due dates, and items borrowed from or lent to other people. Everything lives in your browser's local storage — nothing is synced, nothing is sent anywhere.

Part of the ASDALE DYNAMICS, LLC collection of local-first life-admin helpers. A companion to [warranty-renewal-tracker-webapp](https://github.com/dylanasdale/warranty-renewal-tracker-webapp), which handles warranties; this one handles returns.

## How to run it

1. Download (or clone) this folder.
2. Double-click `index.html` — or drag it into any browser.
3. That's it. No server, no install, no internet connection required.

You can also run it from `file://` directly. The app works fully offline.

## What it does

- **Return items** — cards showing what you bought, the store, the purchase date, the return-policy length in days, and a big countdown ("5 days left", "Last day today", "3 days past window") with a plain-English status: calm green when there's runway, amber when it's coming up, red when the window has closed.
- **Library books** — due-date rows with countdowns and a "mark returned" button, so you can keep or clear finished books.
- **Borrowed & lent** — track that drill you lent the neighbor or the cookbook your aunt borrowed, with optional "expected back" dates and overdue counts.
- **Month-ahead nudge view** — every deadline from today through the next two months, grouped by month and sorted by date, so you can see what's coming without hunting across tabs.
- **Printable return receipt checklist** — pick the items you're taking back, check the boxes, and print (or save as PDF). The print layout strips everything else off the page.
- **CSV export** — one-click CSV files for returns, library books, loans, or everything combined. Handy for spreadsheets or backups.
- **Sample data & reset** — a "load sample data" button for trying it out, and a full erase-all if you ever want a clean slate.

## Privacy, in one breath

All data is stored in your browser's `localStorage` under the key `return-deadline-tracker.v1`. There is no network code, no analytics, no accounts, no cookies beyond what localStorage provides. Clearing your browser data erases the app's data — the CSV export exists precisely so you can keep an external copy.

## Counts as "days" how?

Dates are pure calendar math: a 30-day policy on something bought October 10 expires November 9. The countdown compares your purchase date + policy days to today, ignoring times of day and time zones, so "3 days left" means the same thing whether you check at midnight or noon.

## Testing

The countdown math (date parsing, expiry calculation, status buckets, labels, month rollovers, leap days) is tested with plain Node.js — no test framework needed:

```bash
node tests/countdown.test.js
```

41 assertions covering the pure functions extracted straight from `index.html`, so the tests always exercise the code the app actually ships.

## Project layout

```
index.html                  the entire app (HTML + CSS + JS, single file)
tests/countdown.test.js     plain-Node tests for the countdown math
LICENSE                     MIT
STATUS.md                   build status, verification notes, known gaps
```

## Credits

Built by [Asdale Dynamics, LLC](https://dylanasdale.github.io) — the company behind *The Massive AI Manual*, written by Dylan Asdale. The LLC makes beginner-friendly AI books, local-first tools, and low-energy life-admin helpers that explain things "like a friend would": plain English, step by step, never condescending.

## License

MIT. See [LICENSE](LICENSE).
