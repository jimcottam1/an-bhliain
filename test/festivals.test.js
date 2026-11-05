const test = require('node:test');
const assert = require('node:assert');
const Festivals = require('../site/festivals.js');
const Wheel = require('../site/wheel.js');
const Lore = require('../site/lore.js');
const lore = require('../site/data/lore.json');

const iso = (t) => new Date(t).toISOString().slice(0, 10);

test('the four quarter days are 1 Nov, 1 Feb, 1 May and 1 Aug', () => {
  const l = Festivals.list(2026).filter((f) => f.kind === 'quarter' && f.t >= Date.UTC(2026, 0, 1) && f.t < Date.UTC(2027, 0, 1));
  assert.deepStrictEqual(l.map((f) => iso(f.t) + ' ' + f.name),
    ['2026-02-01 Imbolc', '2026-05-01 Bealtaine', '2026-08-01 Lughnasa', '2026-11-01 Samhain']);
});

test('the solstices and equinoxes for 2026 are in the list with Irish and English names', () => {
  const sun = Festivals.list(2026).filter((f) => f.kind === 'sun' && iso(f.t).startsWith('2026'));
  assert.deepStrictEqual(sun.map((f) => iso(f.t) + ' ' + f.english),
    ['2026-03-20 spring equinox', '2026-06-21 summer solstice', '2026-09-23 autumn equinox', '2026-12-21 winter solstice']);
  assert.ok(sun.every((f) => f.name && f.english));
});

test('the list is sorted by date', () => {
  const l = Festivals.list(2027);
  for (let i = 1; i < l.length; i++) assert.ok(l[i].t >= l[i - 1].t);
});

test('from 3 Nov 2026 the next key day is the winter solstice, 48 days away', () => {
  const n = Festivals.next(2026, 11, 3);
  assert.strictEqual(n.festival.key, 'winterSolstice');
  assert.strictEqual(n.days, 48);
});

test('the countdown is 0 on the day itself when today counts, and moves on when it does not', () => {
  assert.strictEqual(Festivals.next(2026, 12, 21, true).days, 0);
  const after = Festivals.next(2026, 12, 21, false);
  assert.strictEqual(after.festival.name, 'Imbolc');
  assert.strictEqual(after.days, 42);
});

test('the countdown works across New Year and a leap day', () => {
  assert.strictEqual(Festivals.next(2027, 12, 25).festival.key, 'imbolc');
  assert.strictEqual(Festivals.next(2027, 12, 25).days, 38);
  assert.strictEqual(Festivals.next(2028, 2, 28).days, 21); // 2028 is a leap year: 29 Feb, then 20 March
});

test('upcoming returns the requested number in order, starting today', () => {
  const u = Festivals.upcoming(2026, 11, 3, 4);
  assert.strictEqual(u.length, 4);
  assert.deepStrictEqual(u.map((x) => x.festival.key), ['winterSolstice', 'imbolc', 'springEquinox', 'bealtaine']);
  assert.ok(u[0].days < u[1].days && u[1].days < u[2].days);
});

test('the wheel: the old year starts on 1 November at angle 0 and Imbolc is about a quarter round', () => {
  assert.strictEqual(Wheel.angleFor(2026, 11, 1), 0);
  const a = Wheel.angleFor(2027, 2, 1);
  assert.ok(a > 85 && a < 95, 'got ' + a);
});

test('the wheel: 3 Nov 2026 is in Geimhreadh and Imbolc is 90 days away', () => {
  const s = Wheel.seasonFor(2026, 11, 3);
  assert.strictEqual(s.current.irish, 'Geimhreadh');
  assert.strictEqual(s.next.quarter, 'Imbolc');
  assert.strictEqual(s.daysToNext, 90);
});

test('the wheel: day index to date and back round-trips, including across a leap year', () => {
  for (const [y, m, d] of [[2026, 11, 3], [2027, 2, 28], [2028, 2, 29], [2028, 3, 1], [2027, 10, 31]]) {
    const p = Wheel.yearPosition(y, m, d);
    assert.deepStrictEqual(Wheel.dateFromIndex(p.startYear, p.dayIndex), { year: y, month: m, day: d });
  }
  assert.strictEqual(Wheel.yearPosition(2028, 2, 29).length, 366); // the old year that contains 29 Feb 2028 started on 1 Nov 2027
  assert.strictEqual(Wheel.yearPosition(2027, 10, 31).length, 365);
});

test('lore: the entry for the day is chosen when there is one', () => {
  const hit = Lore.nearest(lore.entries, 2026, 11, 2);
  assert.strictEqual(hit.entry.id, 'all-souls');
  assert.strictEqual(hit.offset, 0);
});

test('lore: otherwise the nearest entry, with ties going to the upcoming one', () => {
  const hit = Lore.nearest(lore.entries, 2026, 11, 3);
  assert.strictEqual(hit.entry.id, 'hearth'); // 4 Nov is one day ahead; 2 Nov was one day back
  assert.strictEqual(hit.offset, 1);
});

test('lore: nearest works across New Year', () => {
  const hit = Lore.nearest([{ month: 12, day: 30 }, { month: 1, day: 20 }], 2027, 1, 1);
  assert.strictEqual(hit.entry.month, 12);
  assert.strictEqual(hit.offset, -2);
});

test('lore: comingUp is in date order and all in the future', () => {
  const rows = Lore.comingUp(lore.entries, 2026, 11, 3, 5);
  assert.strictEqual(rows.length, 5);
  for (let i = 0; i < rows.length; i++) {
    assert.ok(rows[i].offset > 0);
    if (i) assert.ok(rows[i].offset >= rows[i - 1].offset);
  }
});

test('lore data: every entry has a label, sources, text, a valid date and a draft status', () => {
  assert.ok(lore.entries.length >= 25, 'only ' + lore.entries.length);
  const ids = new Set();
  for (const e of lore.entries) {
    assert.ok(!ids.has(e.id), 'duplicate id ' + e.id); ids.add(e.id);
    assert.ok(['Fact', 'Tradition', 'Saying'].includes(e.kind), e.id + ' kind');
    assert.ok(Array.isArray(e.sources) && e.sources.length >= (e.sourcesChecked ? 2 : 1), e.id + ' needs two sources (one while unchecked)');
    assert.ok(e.sources.every((s) => typeof s === 'string' && s.length > 5), e.id + ' source text');
    assert.strictEqual(e.status, 'draft', e.id + ' must be draft');
    assert.strictEqual(typeof e.sourcesChecked, 'boolean', e.id + ' sourcesChecked');
    assert.ok(['supported', 'reworded', 'partial', 'marked', 'drop'].includes(e.verdict), e.id + ' verdict must be one of the five, got ' + e.verdict);
    assert.ok(typeof e.checkNote === 'string' && e.checkNote.length > 10, e.id + ' needs a checkNote');
    if (e.verdict === 'partial' || e.verdict === 'marked') assert.strictEqual(e.sourcesChecked, false, e.id + ' partial or marked means unchecked');
    if (e.sourcesChecked) {
      assert.ok(e.sources.length >= 2, e.id + ' checked needs two sources');
      assert.ok(!/still needed/i.test(JSON.stringify(e)), e.id + ' is checked but still says a source is needed');
      for (const src of e.sources) assert.match(src, /checked 20\d\d-\d\d-\d\d/, e.id + ' every source needs a checked date');
    }
    assert.ok(e.title && e.text && e.someplacessay, e.id + ' fields');
    assert.ok(e.month >= 1 && e.month <= 12 && e.day >= 1 && e.day <= 31, e.id + ' date');
    const dt = new Date(Date.UTC(2028, e.month - 1, e.day));
    assert.strictEqual(dt.getUTCMonth(), e.month - 1, e.id + ' day exists in the month');
  }
});

test('lore data: the eight key days are all present', () => {
  const need = ['samhain', 'imbolc', 'bealtaine', 'lughnasa', 'winter-solstice', 'spring-equinox', 'summer-solstice', 'autumn-equinox'];
  for (const id of need) assert.ok(lore.entries.some((e) => e.id === id), 'missing ' + id);
});

test('lore: comingUp leaves out an entry that falls on the chosen day', () => {
  const rows = Lore.comingUp(lore.entries, 2026, 11, 4, 3); // the 4 Nov card is the day itself
  assert.strictEqual(rows[0].entry.id, 'martinmas');
  assert.ok(rows.every((r) => r.entry.id !== 'hearth'));
});

test('lore: a card with holdBack true is never chosen or listed, and the switch is reversible', () => {
  const entries = [{ id: 'a', month: 11, day: 3 }, { id: 'b', month: 11, day: 4, holdBack: true }, { id: 'c', month: 11, day: 9 }];
  assert.strictEqual(Lore.nearest(entries, 2026, 11, 4).entry.id, 'a');
  assert.ok(!Lore.comingUp(entries, 2026, 11, 3, 5).some((r) => r.entry.id === 'b'));
  entries[1].holdBack = false;
  assert.strictEqual(Lore.nearest(entries, 2026, 11, 4).entry.id, 'b');
});

test('lore data: christmas-eve and lady-day are held back for now (recommendation, owner to confirm)', () => {
  for (const id of ['christmas-eve', 'lady-day']) assert.strictEqual(lore.entries.find((e) => e.id === id).holdBack, true);
  assert.notStrictEqual(Lore.nearest(lore.entries, 2026, 12, 24).entry.id, 'christmas-eve');
});
