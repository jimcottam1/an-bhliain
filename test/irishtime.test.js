const test = require('node:test');
const assert = require('node:assert');
const IrishTime = require('../site/irishtime.js');
const Solar = require('../site/solar.js');

test('clocks go forward on 29 March 2026 at 01:00 UTC', () => {
  assert.strictEqual(IrishTime.clock(new Date('2026-03-29T00:59:00Z')), '00:59');
  assert.strictEqual(IrishTime.clock(new Date('2026-03-29T01:00:00Z')), '02:00');
});

test('clocks go back on 25 October 2026 at 01:00 UTC', () => {
  assert.strictEqual(IrishTime.clock(new Date('2026-10-25T00:59:00Z')), '01:59');
  assert.strictEqual(IrishTime.clock(new Date('2026-10-25T01:00:00Z')), '01:00');
});

test('winter time is UTC and summer time is UTC plus one hour', () => {
  assert.strictEqual(IrishTime.clock(new Date('2026-12-21T12:00:00Z')), '12:00');
  assert.strictEqual(IrishTime.clock(new Date('2026-06-21T12:00:00Z')), '13:00');
});

test('the Irish calendar date rolls over at local midnight, not UTC midnight', () => {
  // 23:30 UTC on 24 June is 00:30 on 25 June in Ireland (summer time)
  assert.deepStrictEqual(IrishTime.dateParts(new Date('2026-06-24T23:30:00Z')), { year: 2026, month: 6, day: 25 });
  // in winter there is no shift
  assert.deepStrictEqual(IrishTime.dateParts(new Date('2026-12-24T23:30:00Z')), { year: 2026, month: 12, day: 24 });
  // the night the clocks go back: 23:30 UTC on 24 Oct is already 25 Oct in Ireland
  assert.deepStrictEqual(IrishTime.dateParts(new Date('2026-10-24T23:30:00Z')), { year: 2026, month: 10, day: 25 });
});

test('Limerick sunrise is shown in Irish time: about 05:10 on midsummer, 08:44 on midwinter', () => {
  const s = Solar.sunTimes(2026, 6, 21, 52.66, -8.63), w = Solar.sunTimes(2026, 12, 21, 52.66, -8.63);
  const sr = IrishTime.clockFromUtcMinutes(s.sunrise, 2026, 6, 21), wr = IrishTime.clockFromUtcMinutes(w.sunrise, 2026, 12, 21);
  assert.ok(sr >= '05:05' && sr <= '05:15', sr);
  assert.ok(wr >= '08:40' && wr <= '08:50', wr);
});

test('the sunrise clock shows the hour change across the March and October clock changes', () => {
  const dayBefore = Solar.sunTimes(2026, 3, 28, 52.66, -8.63), dayAfter = Solar.sunTimes(2026, 3, 30, 52.66, -8.63);
  const toMin = (s) => { const [h, m] = s.split(':'); return +h * 60 + +m; };
  const a = toMin(IrishTime.clockFromUtcMinutes(dayBefore.sunrise, 2026, 3, 28));
  const b = toMin(IrishTime.clockFromUtcMinutes(dayAfter.sunrise, 2026, 3, 30));
  assert.ok(b - a > 40 && b - a < 80, 'clock should jump forward about an hour: ' + (b - a));
  const c = Solar.sunTimes(2026, 10, 24, 52.66, -8.63), d = Solar.sunTimes(2026, 10, 26, 52.66, -8.63);
  const e = toMin(IrishTime.clockFromUtcMinutes(c.sunrise, 2026, 10, 24)), f = toMin(IrishTime.clockFromUtcMinutes(d.sunrise, 2026, 10, 26));
  assert.ok(e - f > 40 && e - f < 80, 'clock should jump back about an hour: ' + (e - f));
});
