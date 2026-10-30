/*
 * Tests for the countdown math used by the Return Deadline Tracker.
 * Runs with plain Node.js (no dependencies):
 *
 *     node tests/countdown.test.js
 *
 * The pure functions under test live inside index.html between the
 * COUNTDOWN-CORE-START / COUNTDOWN-CORE-END markers. This script extracts
 * that exact block from the HTML file and evaluates it, so the tests always
 * cover the code the app actually ships.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const START = 'COUNTDOWN-CORE-START */';
const END = '/* COUNTDOWN-CORE-END */';
const i0 = html.indexOf(START);
const i1 = html.indexOf(END);
assert(i0 !== -1 && i1 !== -1 && i1 > i0, 'countdown core block found in index.html');
const core = html.slice(i0 + START.length, i1);

// Run the core in a bare sandbox so it cannot touch the browser-only app code.
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(core, sandbox, { filename: 'countdown-core.js' });

const {
  parseDateStr, daysUntil, addDays, expiryDate, statusFor, countdownLabel,
  fmtDateHuman, monthName, monthKey, DAY_MS
} = sandbox;

function isDate(d) {
  return Object.prototype.toString.call(d) === '[object Date]';
}

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok - ' + name);
  } catch (e) {
    failed++;
    console.error('  FAIL - ' + name);
    console.error('       ' + (e && e.message));
  }
}

console.log('countdown math tests');

// ---------- DAY_MS ----------
test('DAY_MS is exactly 86400000', () => {
  assert.strictEqual(DAY_MS, 86400000);
});

// ---------- parseDateStr ----------
test('parseDateStr accepts valid ISO dates', () => {
  assert.ok(isDate(parseDateStr('2026-03-05')));
});
test('parseDateStr rejects non-ISO strings', () => {
  assert.strictEqual(parseDateStr('not-a-date'), null);
  assert.strictEqual(parseDateStr('2026/03/05'), null);
  assert.strictEqual(parseDateStr('2026-3-5'), null);
});
test('parseDateStr rejects impossible dates', () => {
  assert.strictEqual(parseDateStr('2026-02-30'), null);
  assert.strictEqual(parseDateStr('2025-02-29'), null); // 2025 is not a leap year
  assert.strictEqual(parseDateStr('2026-13-01'), null);
  assert.strictEqual(parseDateStr('2026-00-10'), null);
});
test('parseDateStr accepts real leap day', () => {
  assert.ok(isDate(parseDateStr('2028-02-29')));
});
test('parseDateStr rejects non-strings and empty input', () => {
  assert.strictEqual(parseDateStr(null), null);
  assert.strictEqual(parseDateStr(undefined), null);
  assert.strictEqual(parseDateStr(''), null);
  assert.strictEqual(parseDateStr(20260305), null);
});

// ---------- daysUntil ----------
test('daysUntil is 0 for today', () => {
  assert.strictEqual(daysUntil('2026-10-30', '2026-10-30'), 0);
});
test('daysUntil counts forward days', () => {
  assert.strictEqual(daysUntil('2026-10-31', '2026-10-30'), 1);
  assert.strictEqual(daysUntil('2026-11-29', '2026-10-30'), 30);
});
test('daysUntil counts backward days (overdue)', () => {
  assert.strictEqual(daysUntil('2026-10-29', '2026-10-30'), -1);
  assert.strictEqual(daysUntil('2026-09-30', '2026-10-30'), -30);
});
test('daysUntil crosses month boundaries correctly', () => {
  assert.strictEqual(daysUntil('2026-11-01', '2026-10-31'), 1);
  assert.strictEqual(daysUntil('2027-01-01', '2026-12-31'), 1);
});
test('daysUntil crosses a leap day correctly', () => {
  assert.strictEqual(daysUntil('2028-03-01', '2028-02-28'), 2); // via Feb 29
  assert.strictEqual(daysUntil('2027-03-01', '2027-02-28'), 1); // non-leap year
});
test('daysUntil handles year rollover', () => {
  assert.strictEqual(daysUntil('2027-01-01', '2026-01-01'), 365);
  assert.strictEqual(daysUntil('2028-01-01', '2027-01-01'), 365); // Feb 29, 2028 falls after Jan 1, 2028
});
test('daysUntil ignores time zones by design (pure date math)', () => {
  assert.strictEqual(daysUntil('2026-04-15', '2026-04-10'), 5);
});
test('daysUntil returns null for bad input', () => {
  assert.strictEqual(daysUntil('garbage', '2026-10-30'), null);
  assert.strictEqual(daysUntil('2026-10-30', 'garbage'), null);
});

// ---------- addDays ----------
test('addDays adds within a month', () => {
  assert.strictEqual(addDays('2026-10-30', 1), '2026-10-31');
});
test('addDays rolls over the month', () => {
  assert.strictEqual(addDays('2026-10-31', 1), '2026-11-01');
  assert.strictEqual(addDays('2026-01-31', 30), '2026-03-02');
});
test('addDays rolls over the year', () => {
  assert.strictEqual(addDays('2026-12-31', 1), '2027-01-01');
});
test('addDays handles the leap day', () => {
  assert.strictEqual(addDays('2028-02-28', 1), '2028-02-29');
  assert.strictEqual(addDays('2027-02-28', 1), '2027-03-01');
});
test('addDays supports negative offsets', () => {
  assert.strictEqual(addDays('2026-11-01', -1), '2026-10-31');
});
test('addDays of zero is identity', () => {
  assert.strictEqual(addDays('2026-10-30', 0), '2026-10-30');
});
test('addDays returns null for bad input', () => {
  assert.strictEqual(addDays('nope', 3), null);
});

// ---------- expiryDate ----------
test('expiryDate adds the policy window to purchase date', () => {
  assert.strictEqual(expiryDate('2026-01-15', 30), '2026-02-14');
});
test('expiryDate of 0 days means same day', () => {
  assert.strictEqual(expiryDate('2026-03-05', 0), '2026-03-05');
});
test('expiryDate handles long windows across years', () => {
  assert.strictEqual(expiryDate('2026-10-30', 365), '2027-10-30');
});
test('expiryDate handles 90-day windows', () => {
  assert.strictEqual(expiryDate('2026-06-30', 90), '2026-09-28');
});
test('expiryDate returns null for invalid input', () => {
  assert.strictEqual(expiryDate('nope', 30), null);
  assert.strictEqual(expiryDate('2026-10-30', -1), null);
  assert.strictEqual(expiryDate('2026-10-30', 'abc'), null);
  assert.strictEqual(expiryDate('2026-10-30', NaN), null);
});

// ---------- statusFor ----------
test('statusFor buckets the countdown', () => {
  assert.strictEqual(statusFor(-1), 'expired');
  assert.strictEqual(statusFor(-90), 'expired');
  assert.strictEqual(statusFor(0), 'today');
  assert.strictEqual(statusFor(1), 'soon');
  assert.strictEqual(statusFor(7), 'soon');
  assert.strictEqual(statusFor(8), 'ok');
  assert.strictEqual(statusFor(365), 'ok');
});
test('statusFor returns none for missing values', () => {
  assert.strictEqual(statusFor(null), 'none');
  assert.strictEqual(statusFor(undefined), 'none');
});

// ---------- countdownLabel ----------
test('countdownLabel shows expired state', () => {
  const l = countdownLabel(-3);
  assert.strictEqual(l.cls, 'cd-expired');
  assert.match(l.text, /3 days past window/);
});
test('countdownLabel singular for one day past', () => {
  const l = countdownLabel(-1);
  assert.match(l.text, /1 day past window/);
});
test('countdownLabel shows last-day urgency', () => {
  const l = countdownLabel(0);
  assert.strictEqual(l.cls, 'cd-today');
  assert.match(l.text, /Last day today/);
});
test('countdownLabel shows soon with singular/plural', () => {
  assert.match(countdownLabel(1).text, /^1 day left$/);
  assert.match(countdownLabel(5).text, /^5 days left$/);
  assert.strictEqual(countdownLabel(5).cls, 'cd-soon');
});
test('countdownLabel shows calm state for plenty of runway', () => {
  const l = countdownLabel(40);
  assert.strictEqual(l.cls, 'cd-ok');
  assert.match(l.text, /^40 days left$/);
});
test('countdownLabel handles no date at all', () => {
  const l = countdownLabel(null);
  assert.strictEqual(l.cls, 'cd-none');
});

// ---------- fmtDateHuman ----------
test('fmtDateHuman formats for humans', () => {
  assert.strictEqual(fmtDateHuman('2026-03-05'), 'Mar 5, 2026');
  assert.strictEqual(fmtDateHuman('2026-12-31'), 'Dec 31, 2026');
});
test('fmtDateHuman passes garbage through unchanged', () => {
  assert.strictEqual(fmtDateHuman('not-a-date'), 'not-a-date');
  assert.strictEqual(fmtDateHuman(''), '');
});

// ---------- month helpers ----------
test('monthKey slices year-month', () => {
  assert.strictEqual(monthKey('2026-10-30'), '2026-10');
});
test('monthName spells out the month and year', () => {
  assert.strictEqual(monthName('2026-10-30'), 'October 2026');
  assert.strictEqual(monthName('2027-01-05'), 'January 2027');
});

// ---------- integration-style checks (realistic scenarios) ----------
test('scenario: 30-day return window ending soon', () => {
  const expiry = expiryDate('2026-10-05', 30); // 2026-11-04
  const days = daysUntil(expiry, '2026-10-30');
  assert.strictEqual(expiry, '2026-11-04');
  assert.strictEqual(days, 5);
  assert.strictEqual(statusFor(days), 'soon');
});
test('scenario: overdue library book', () => {
  const days = daysUntil('2026-10-20', '2026-10-30');
  assert.strictEqual(days, -10);
  assert.strictEqual(statusFor(days), 'expired');
});
test('scenario: item lent for two weeks', () => {
  const back = addDays('2026-10-20', 14);
  assert.strictEqual(back, '2026-11-03');
  assert.strictEqual(daysUntil(back, '2026-10-30'), 4);
});

console.log('---');
console.log((failed === 0 ? 'PASS' : 'FAIL') + ': ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed === 0 ? 0 : 1);
