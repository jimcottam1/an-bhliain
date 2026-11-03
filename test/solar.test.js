const test = require('node:test');
const assert = require('node:assert');
const Solar = require('../site/solar.js');

const LIMERICK = [52.66, -8.63], DUBLIN = [53.35, -6.26], BELFAST = [54.60, -5.93];

// An independent implementation (the "Almanac for Computers" method, different formulae
// from solar.js) used only to cross-check. Returns minutes after 00:00 UTC.
function almanac(y, m, d, lat, lon, rising) {
  const rad = Math.PI / 180, deg = 180 / Math.PI, zenith = 90.833;
  const sin = (x) => Math.sin(x * rad), cos = (x) => Math.cos(x * rad), tan = (x) => Math.tan(x * rad);
  const N1 = Math.floor(275 * m / 9), N2 = Math.floor((m + 9) / 12);
  const N3 = 1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3);
  const N = N1 - N2 * N3 + d - 30;
  const lngHour = lon / 15;
  const t = N + ((rising ? 6 : 18) - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  let L = (M + 1.916 * sin(M) + 0.020 * sin(2 * M) + 282.634) % 360; if (L < 0) L += 360;
  let RA = (Math.atan(0.91764 * tan(L)) * deg) % 360; if (RA < 0) RA += 360;
  RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
  RA /= 15;
  const sinDec = 0.39782 * sin(L), cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (cos(zenith) - sinDec * sin(lat)) / (cosDec * cos(lat));
  let H = Math.acos(cosH) * deg; if (rising) H = 360 - H; H /= 15;
  const T = H + RA - 0.06571 * t - 6.622;
  let UT = (T - lngHour) % 24; if (UT < 0) UT += 24;
  return UT * 60;
}

const DATES = [[2026, 3, 20], [2026, 6, 21], [2026, 9, 23], [2026, 12, 21], [2026, 11, 3], [2027, 2, 1], [2027, 5, 1], [2027, 8, 1]];

test('sunrise and sunset agree with an independent algorithm within 4 minutes (Dublin, Limerick, Belfast)', () => {
  for (const [name, [lat, lon]] of [['Limerick', LIMERICK], ['Dublin', DUBLIN], ['Belfast', BELFAST]]) {
    for (const [y, m, d] of DATES) {
      const s = Solar.sunTimes(y, m, d, lat, lon);
      const r = almanac(y, m, d, lat, lon, true), ss = almanac(y, m, d, lat, lon, false);
      assert.ok(Math.abs(s.sunrise - r) < 4, `${name} ${y}-${m}-${d} sunrise ${s.sunrise} vs ${r}`);
      assert.ok(Math.abs(s.sunset - ss) < 4, `${name} ${y}-${m}-${d} sunset ${s.sunset} vs ${ss}`);
    }
  }
});

test('Dublin day length on the solstices is in the known range', () => {
  const winter = Solar.sunTimes(2026, 12, 21, ...DUBLIN).dayLength / 60;
  const summer = Solar.sunTimes(2026, 6, 21, ...DUBLIN).dayLength / 60;
  assert.ok(winter > 7.35 && winter < 7.7, 'winter ' + winter);
  assert.ok(summer > 16.85 && summer < 17.25, 'summer ' + summer);
});

test('Limerick day length on the solstices is in the known range', () => {
  const winter = Solar.sunTimes(2026, 12, 21, ...LIMERICK).dayLength / 60;
  const summer = Solar.sunTimes(2026, 6, 21, ...LIMERICK).dayLength / 60;
  assert.ok(winter > 7.45 && winter < 7.8, 'winter ' + winter);
  assert.ok(summer > 16.7 && summer < 17.1, 'summer ' + summer);
});

test('Limerick sunrise is later than Dublin (it is further west)', () => {
  const l = Solar.sunTimes(2026, 12, 21, ...LIMERICK).sunrise, d = Solar.sunTimes(2026, 12, 21, ...DUBLIN).sunrise;
  assert.ok(l - d > 5 && l - d < 15, 'gap ' + (l - d));
});

test('days shorten after midsummer, lengthen after midwinter, and barely change at the solstices', () => {
  assert.ok(Solar.dayLengthChangeSeconds(2026, 11, 3, ...LIMERICK) < -120);
  assert.ok(Solar.dayLengthChangeSeconds(2027, 2, 3, ...LIMERICK) > 120);
  assert.ok(Math.abs(Solar.dayLengthChangeSeconds(2026, 12, 21, ...LIMERICK)) < 30);
  assert.ok(Math.abs(Solar.dayLengthChangeSeconds(2026, 6, 21, ...LIMERICK)) < 30);
});

test('the daylight change is about 3 to 4 minutes a day in early November in Limerick', () => {
  const c = Solar.dayLengthChangeSeconds(2026, 11, 3, ...LIMERICK);
  assert.ok(c > -270 && c < -150, 'got ' + c);
});
