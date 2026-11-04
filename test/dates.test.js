const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const IrishTime = require('../site/irishtime.js');
const Share = require('../site/share.js');

const parse = (s) => IrishTime.parseDateParam(s);

// ---------- ?date= is read strictly ----------
test('a good ?date= is read, alone or among other parameters', () => {
  assert.deepStrictEqual(parse('?date=2027-02-01'), { year: 2027, month: 2, day: 1 });
  assert.deepStrictEqual(parse('?v=3&date=2026-11-04'), { year: 2026, month: 11, day: 4 });
  assert.deepStrictEqual(parse('?date=2026-11-04&v=3'), { year: 2026, month: 11, day: 4 });
});

test('no parameter, or an empty search, gives nothing', () => {
  assert.strictEqual(parse(''), null);
  assert.strictEqual(parse('?v=1'), null);
  assert.strictEqual(parse(undefined), null);
});

test('the pattern is anchored: other names, extra digits and trailing junk are refused', () => {
  assert.strictEqual(parse('?xdate=2026-11-04'), null);
  assert.strictEqual(parse('?mydate=2026-11-04'), null);
  assert.strictEqual(parse('?date=2026-11-04abc'), null);
  assert.strictEqual(parse('?date=12026-11-04'), null);
  assert.strictEqual(parse('?date=2026-11-045'), null);
  assert.strictEqual(parse('?date=2026-11-04-05'), null);
  assert.strictEqual(parse('?date=2026-1-4'), null);
});

test('dates that do not exist are refused, including the 30th of February and month 13', () => {
  assert.strictEqual(parse('?date=2026-02-30'), null);
  assert.strictEqual(parse('?date=2026-13-45'), null);
  assert.strictEqual(parse('?date=2026-00-10'), null);
  assert.strictEqual(parse('?date=2026-04-31'), null);
  assert.strictEqual(parse('?date=2026-11-00'), null);
});

test('29 February is accepted only in a leap year', () => {
  assert.deepStrictEqual(parse('?date=2028-02-29'), { year: 2028, month: 2, day: 29 });
  assert.strictEqual(parse('?date=2027-02-29'), null);
  assert.strictEqual(parse('?date=2100-02-29'), null); // 2100 is not a leap year
});

test('years from 1900 to 2100 are allowed, and nothing outside them', () => {
  assert.deepStrictEqual(parse('?date=1900-01-01'), { year: 1900, month: 1, day: 1 });
  assert.deepStrictEqual(parse('?date=2100-12-31'), { year: 2100, month: 12, day: 31 });
  assert.strictEqual(parse('?date=1899-12-31'), null);
  assert.strictEqual(parse('?date=2101-01-01'), null);
  assert.strictEqual(parse('?date=0000-01-01'), null);
  assert.strictEqual(parse('?date=0050-06-01'), null);
});

// ---------- the real today and the start day are kept apart ----------
const NOW = new Date('2026-11-04T12:00:00Z');

test('without a parameter the start day is the real Irish today', () => {
  const r = IrishTime.startDate('', NOW);
  assert.deepStrictEqual(r.today, { year: 2026, month: 11, day: 4 });
  assert.deepStrictEqual(r.start, r.today);
});

test('with ?date= the start day changes but the real today does not', () => {
  const r = IrishTime.startDate('?date=2027-02-01', NOW);
  assert.deepStrictEqual(r.today, { year: 2026, month: 11, day: 4 });
  assert.deepStrictEqual(r.start, { year: 2027, month: 2, day: 1 });
});

test('a bad ?date= quietly falls back to the real today', () => {
  const r = IrishTime.startDate('?date=2026-02-30', NOW);
  assert.deepStrictEqual(r.start, r.today);
  assert.deepStrictEqual(r.today, { year: 2026, month: 11, day: 4 });
});

test('a link opened with ?date=2027-02-01 and shared again keeps the date', () => {
  const loc = { protocol: 'https:', origin: 'https://example.github.io', pathname: '/an-bhliain/', search: '?date=2027-02-01', hash: '' };
  const r = IrishTime.startDate(loc.search, NOW);
  assert.strictEqual(Share.link(loc, r.start, r.today), 'https://example.github.io/an-bhliain/?date=2027-02-01');
});

test('sharing the real today from a ?date= link gives the plain address, so the Today button works', () => {
  const loc = { protocol: 'https:', origin: 'https://example.github.io', pathname: '/an-bhliain/', search: '?date=2027-02-01', hash: '' };
  const r = IrishTime.startDate(loc.search, NOW);
  assert.strictEqual(Share.link(loc, r.today, r.today), 'https://example.github.io/an-bhliain/');
});

test('the app reads its start day with IrishTime.startDate and keeps the real today for isToday, the Today button and the share link', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'site', 'app.js'), 'utf8');
  assert.ok(app.includes('IrishTime.startDate(location.search, new Date())'));
  assert.ok(!app.includes('realToday'), 'the old function that treated ?date= as today must be gone');
  assert.ok(app.includes('Share.link(location, sel, today)'));
  assert.ok(app.includes('setDate(today)'));
  assert.match(app, /var today = start\.today;/);
});

// ---------- gaps the judge found ----------
const LOC = { protocol: 'https:', origin: 'https://example.github.io', pathname: '/an-bhliain/', search: '', hash: '' };

test('the same month and day a year later is not today: the link must carry the date', () => {
  assert.strictEqual(Share.link(LOC, { year: 2027, month: 11, day: 4 }, { year: 2026, month: 11, day: 4 }), 'https://example.github.io/an-bhliain/?date=2027-11-04');
  assert.strictEqual(Share.link(LOC, { year: 2025, month: 11, day: 4 }, { year: 2026, month: 11, day: 4 }), 'https://example.github.io/an-bhliain/?date=2025-11-04');
});

test('only an explicitly approved card with checked sources may be shared', () => {
  assert.strictEqual(Share.loreShareable({ status: 'review', sourcesChecked: true }), false);
  assert.strictEqual(Share.loreShareable({ status: 'pending', sourcesChecked: true }), false);
  assert.strictEqual(Share.loreShareable({ status: undefined, sourcesChecked: true }), false);
  assert.strictEqual(Share.loreShareable({ sourcesChecked: true }), false);
  assert.strictEqual(Share.loreShareable({ status: 'approved', sourcesChecked: true }), true);
});
