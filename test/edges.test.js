const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Lore = require('../site/lore.js');
const Share = require('../site/share.js');
const IrishTime = require('../site/irishtime.js');
const lore = require('../site/data/lore.json');

const SITE = path.join(__dirname, '..', 'site');
const LIMERICK = { name: 'Limerick', lat: 52.66, lon: -8.63 };
const held = lore.entries.filter((e) => e.holdBack);

test('over four whole years (2028 is a leap year) every day has a nearest card, never a held-back one, and never a long wait', () => {
  assert.ok(held.length >= 1, 'the data has held-back cards to test with');
  const heldIds = new Set(held.map((e) => e.id));
  let max = 0;
  for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2029, 11, 31); t += 86400000) {
    const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    const hit = Lore.nearest(lore.entries, y, m, day);
    assert.ok(hit, y + '-' + m + '-' + day + ' has no card');
    assert.ok(!heldIds.has(hit.entry.id), 'held-back card shown on ' + y + '-' + m + '-' + day);
    max = Math.max(max, Math.abs(hit.offset));
    Lore.comingUp(lore.entries, y, m, day, 5).forEach((r) => assert.ok(!heldIds.has(r.entry.id) && r.offset > 0));
  }
  assert.ok(max <= 45, 'the nearest card was ' + max + ' days away');
});

test('cards on 31 Dec and 1 Jan are found on their own day, and the day either side points across the year end', () => {
  const e = [{ id: 'a', month: 12, day: 31 }, { id: 'b', month: 1, day: 1 }, { id: 'c', month: 6, day: 1 }];
  assert.deepStrictEqual([Lore.nearest(e, 2026, 12, 31).entry.id, Lore.nearest(e, 2026, 12, 31).offset], ['a', 0]);
  assert.deepStrictEqual([Lore.nearest(e, 2027, 1, 1).entry.id, Lore.nearest(e, 2027, 1, 1).offset], ['b', 0]);
  assert.strictEqual(Lore.comingUp(e, 2026, 12, 30, 2).map((r) => r.entry.id + r.offset).join(), 'a1,b2');
  assert.strictEqual(Lore.comingUp(e, 2026, 12, 31, 2)[0].entry.id, 'b');
});

test('a 29 February card: on the day in a leap year; the day after 28 February in other years (documented behaviour)', () => {
  const e = [{ id: 'leap', month: 2, day: 29 }, { id: 'far', month: 8, day: 1 }];
  const leap = Lore.nearest(e, 2028, 2, 29);
  assert.deepStrictEqual([leap.entry.id, leap.offset], ['leap', 0]);
  const plain = Lore.nearest(e, 2027, 2, 28);
  assert.deepStrictEqual([plain.entry.id, plain.offset], ['leap', 1], '29 Feb 2027 rolls to 1 March');
  assert.strictEqual(Lore.comingUp(e, 2027, 2, 28, 1)[0].offset, 1);
});

test('a card held back can never be shared, even if it were marked approved with checked sources', () => {
  const e = { status: 'approved', sourcesChecked: true, holdBack: true };
  assert.strictEqual(Share.loreShareable(e), false);
  assert.strictEqual(Share.loreShareable({ status: 'approved', sourcesChecked: true }), true);
});

test('the share line, the share picture and the page tags never carry a held-back card', () => {
  const picture = fs.readFileSync(path.join(SITE, 'og.svg'), 'utf8') + fs.readFileSync(path.join(SITE, 'index.html'), 'utf8').match(/<meta[^>]*og:[^>]*>/g).join('');
  for (const e of held) {
    assert.ok(!picture.includes(e.title) && !picture.includes(e.text.slice(0, 30)), e.id + ' leaked into the share picture or tags');
    for (const [mo, d] of [[e.month, e.day], [e.month, e.day + 1]]) {
      const line = Share.line({ year: 2026, month: mo, day: d }, LIMERICK);
      assert.ok(!line.includes(e.title) && !line.includes(e.text.slice(0, 30)));
    }
  }
});

test('?date= share links round trip for the awkward days, and Irish midnight in summer is the next Irish day', () => {
  const loc = { protocol: 'https:', origin: 'https://x.github.io', pathname: '/an-bhliain/', search: '' };
  const today = { year: 2026, month: 11, day: 4 };
  for (const d of [{ year: 2028, month: 2, day: 29 }, { year: 2026, month: 12, day: 31 }, { year: 2027, month: 1, day: 1 }, { year: 1900, month: 1, day: 1 }, { year: 2100, month: 12, day: 31 }]) {
    const url = Share.link(loc, d, today);
    assert.deepStrictEqual(IrishTime.parseDateParam(url.slice(url.indexOf('?'))), d, url);
  }
  assert.deepStrictEqual(IrishTime.startDate('', new Date('2026-06-30T23:30:00Z')).today, { year: 2026, month: 7, day: 1 });
  assert.deepStrictEqual(IrishTime.startDate('', new Date('2026-12-31T23:30:00Z')).today, { year: 2026, month: 12, day: 31 });
  assert.match(Share.line({ year: 2028, month: 2, day: 29 }, LIMERICK), /^29 February · 28 days after Imbolc · /);
  assert.match(Share.line({ year: 2027, month: 1, day: 1 }, LIMERICK), /^1 January · 61 days after Samhain · /);
});

test('lore text cannot break out of an attribute or a tag, apostrophes and quotes included', () => {
  const e = { kind: 'Fact" onmouseover="x', title: "T'<b>", text: "it's <u>", someplacessay: '"><svg onload=1>', sources: ["'><script>"], status: 'draft' };
  const h = Lore.cardHtml(e, 'Head "&" <x>');
  assert.ok(!/<(u|svg|script|x)[\s>]/.test(h), h);
  assert.ok(!/class="kind [^"]*"[^>]*onmouseover/.test(h) && !h.includes('" onmouseover="'));
  assert.ok(h.includes('&#39;'));
});
