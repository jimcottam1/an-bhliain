const test = require('node:test');
const assert = require('node:assert');
const Wheel = require('../site/wheel.js');
const Solar = require('../site/solar.js');

test('the old year starts on 1 November at angle 0', () => {
  assert.strictEqual(Wheel.angleFor(2026, 11, 1), 0);
});
test('Imbolc lies about a quarter of the way round', () => {
  const a = Wheel.angleFor(2027, 2, 1);
  assert.ok(a > 85 && a < 95, 'got ' + a);
});
test('3 Nov 2026 is in Geimhreadh and Imbolc is next, 90 days away', () => {
  const s = Wheel.seasonFor(2026, 11, 3);
  assert.strictEqual(s.current.season, 'Geimhreadh');
  assert.strictEqual(s.next.name, 'Imbolc');
  assert.strictEqual(s.daysToNext, 90);
});
test('Limerick midwinter day is about 7h35m long', () => {
  const t = Solar.sunTimes(2026, 12, 21, 52.66, -8.63);
  assert.ok(Math.abs(t.dayLength - 455) < 8, 'got ' + t.dayLength);
});
test('Limerick midsummer day is about 17h long', () => {
  const t = Solar.sunTimes(2026, 6, 21, 52.66, -8.63);
  assert.ok(Math.abs(t.dayLength - 1010) < 12, 'got ' + t.dayLength);
});
test('days are getting shorter in early November', () => {
  assert.ok(Solar.dayLengthChangeSeconds(2026, 11, 3, 52.66, -8.63) < -120);
});
test('lore entries are all draft with a valid label and sources', () => {
  const lore = require('../data/lore.json');
  for (const e of lore.entries) {
    assert.strictEqual(e.status, 'draft');
    assert.ok(['Fact', 'Tradition', 'Saying'].includes(e.kind), e.id);
    assert.ok(e.sources.length > 0, e.id);
  }
});
