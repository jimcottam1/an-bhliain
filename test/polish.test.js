const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Festivals = require('../site/festivals.js');
const IrishTime = require('../site/irishtime.js');
const Wheel = require('../site/wheel.js');
const Lore = require('../site/lore.js');

const usno = require('./fixtures/usno-seasons.json');
const KEYS = { 3: 'springEquinox', 6: 'summerSolstice', 9: 'autumnEquinox', 12: 'winterSolstice' };

test('the solstice and equinox table matches the U.S. Naval Observatory data (UTC converted to the Irish date) for 2026 to 2035', () => {
  for (const [year, rows] of Object.entries(usno.years)) {
    assert.strictEqual(rows.length, 4, year);
    for (const r of rows) {
      const t = new Date(Date.UTC(+year, r.month - 1, r.day, +r.time.slice(0, 2), +r.time.slice(3)));
      const p = IrishTime.dateParts(t);
      assert.deepStrictEqual(Festivals.ASTRO[year][KEYS[r.month]], [p.month, p.day], `${year} ${KEYS[r.month]}`);
    }
  }
});

test('the 2027 winter solstice is on 22 December (02:42 UTC), not the 21st', () => {
  assert.deepStrictEqual(Festivals.ASTRO[2027].winterSolstice, [12, 22]);
  const n = Festivals.next(2027, 12, 21);
  assert.strictEqual(n.festival.key, 'winterSolstice');
  assert.strictEqual(n.days, 1);
});

test('autumn 2030: the equinox is at 23:27 UTC on 22 Sept, which is already the 23rd in Ireland', () => {
  assert.deepStrictEqual(Festivals.ASTRO[2030].autumnEquinox, [9, 23]);
});

test('the table covers every year the fixture covers, so a gap would be seen', () => {
  assert.deepStrictEqual(Object.keys(Festivals.ASTRO).sort(), Object.keys(usno.years).sort());
});

test('slider text says the day number and the date in words', () => {
  assert.strictEqual(Wheel.dayLabel(2026, 11, 3), 'Day 3 of the old year, 3 November 2026');
  assert.strictEqual(Wheel.dayLabel(2026, 11, 1), 'Day 1 of the old year, 1 November 2026');
  assert.strictEqual(Wheel.dayLabel(2028, 2, 29), 'Day 121 of the old year, 29 February 2028');
});

test('phone wheel text is at least 12 px once scaled to a 390 px screen (season names at least 13 px)', () => {
  const s = Wheel.PHONE_SCALE;
  assert.ok(Wheel.FONT.phone.english * s >= 12, 'english ' + Wheel.FONT.phone.english * s);
  assert.ok(Wheel.FONT.phone.irish * s >= 13, 'irish ' + Wheel.FONT.phone.irish * s);
  assert.ok(Wheel.FONT.phone.tag * s >= 11, 'tag ' + Wheel.FONT.phone.tag * s);
  assert.ok(Wheel.FONT.phone.centreSub * s >= 12, 'centre ' + Wheel.FONT.phone.centreSub * s);
});

test('the four quarter-day names are available for the phone buttons, with dates in wheel order', () => {
  const q = Festivals.quarterDays(2026);
  assert.deepStrictEqual(q.map((x) => x.name), ['Samhain', 'Imbolc', 'Bealtaine', 'Lughnasa']);
  assert.deepStrictEqual(q.map((x) => `${x.year}-${x.month}-${x.day}`), ['2026-11-1', '2027-2-1', '2027-5-1', '2027-8-1']);
  assert.ok(q.every((x) => x.english.startsWith('start of')));
});

test('the headline above a card says when nothing is marked for the day', () => {
  const M = Wheel.MONTH_NAMES, e = { month: 11, day: 4 };
  assert.strictEqual(Lore.describe(0, true, e, M), 'Today in the old year');
  assert.strictEqual(Lore.describe(0, false, e, M), 'On this day');
  assert.strictEqual(Lore.describe(1, true, e, M), 'Nothing marked for today. Nearest card: tomorrow (4 November)');
  assert.strictEqual(Lore.describe(-1, true, e, M), 'Nothing marked for today. Nearest card: yesterday (4 November)');
  assert.strictEqual(Lore.describe(5, false, e, M), 'Nothing marked for this day. Nearest card: in 5 days (4 November)');
  assert.strictEqual(Lore.describe(-3, true, e, M), 'Nothing marked for today. Nearest card: 3 days ago (4 November)');
});

test('the site is publishable from the site/ folder alone: no file refers outside it and the lore sits inside it', () => {
  const dir = path.join(__dirname, '..', 'site');
  for (const f of ['index.html', 'app.js', 'wheel.js', 'festivals.js', 'lore.js', 'solar.js', 'irishtime.js', 'towns.js', 'style.css']) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(!/\.\.\//.test(src), f + ' refers to a parent folder');
  }
  assert.ok(fs.existsSync(path.join(dir, 'data', 'lore.json')));
  assert.ok(fs.readFileSync(path.join(dir, 'app.js'), 'utf8').includes("fetch('data/lore.json')"));
});

test('every script the page loads exists in site/', () => {
  const dir = path.join(__dirname, '..', 'site');
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length >= 7);
  for (const s of srcs) assert.ok(fs.existsSync(path.join(dir, s)), s);
  assert.ok(fs.existsSync(path.join(dir, 'style.css')));
});

test('the slider has an accessible name in the page', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'site', 'index.html'), 'utf8');
  assert.match(html, /<input type="range" id="day"[^>]*aria-label="Day of the old year"/);
});

test('the lower panels are folded by default in the markup (open is set by script on wide screens only)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'site', 'index.html'), 'utf8');
  for (const id of ['p-fest', 'p-curve', 'p-up']) assert.match(html, new RegExp(`<details class="panel" id="${id}">`));
});

test('lore data has grown carefully: at least 30 entries, all draft, unchecked, with a label and two sources', () => {
  const lore = require('../site/data/lore.json');
  assert.ok(lore.entries.length >= 30, 'only ' + lore.entries.length);
  const days = new Set();
  for (const e of lore.entries) {
    assert.strictEqual(e.status, 'draft');
    assert.strictEqual(e.sourcesChecked, false);
    assert.ok(e.sources.length >= 2);
    const k = e.month + '-' + e.day;
    assert.ok(!days.has(k), 'two cards share a date: ' + k); days.add(k);
  }
});

test('the table spans 2026 to 2035 and the fixture records when each batch was fetched', () => {
  const years = Object.keys(Festivals.ASTRO).map(Number).sort((a, b) => a - b);
  assert.strictEqual(years[0], 2026);
  assert.strictEqual(years[years.length - 1], 2035);
  assert.strictEqual(years.length, 10);
  assert.match(usno.fetched, /2026-11-03/);
  assert.match(usno.fetched, /2026-11-04/);
});

test('two awkward Irish dates: the 2031 and 2035 winter solstices fall on 22 December', () => {
  assert.deepStrictEqual(Festivals.ASTRO[2031].winterSolstice, [12, 22]);
  assert.deepStrictEqual(Festivals.ASTRO[2035].winterSolstice, [12, 22]);
  assert.deepStrictEqual(Festivals.ASTRO[2034].autumnEquinox, [9, 22]); // 22:39 UTC is 23:39 in summer time, still the 22nd
});

test('the countdown reaches the 2035 solstice from late 2034', () => {
  const n = Festivals.next(2034, 12, 22);
  assert.strictEqual(n.festival.key, 'imbolc');
  const m = Festivals.next(2035, 11, 3);
  assert.strictEqual(m.festival.key, 'winterSolstice');
  assert.strictEqual(m.days, 49);
});
