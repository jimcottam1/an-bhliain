/* The eight key days of the old year, and countdowns to them.
   Quarter days are fixed dates. Solstices and equinoxes are astronomical, so they come
   from a small table (Irish dates) that must be extended or re-checked each few years. */
(function (root) {
  var DAY = 86400000;
  var QUARTER = [
    { id: 'samhain', name: 'Samhain', english: 'start of winter', month: 11, day: 1 },
    { id: 'imbolc', name: 'Imbolc', english: 'start of spring', month: 2, day: 1 },
    { id: 'bealtaine', name: 'Bealtaine', english: 'start of summer', month: 5, day: 1 },
    { id: 'lughnasa', name: 'Lughnasa', english: 'start of harvest', month: 8, day: 1 }
  ];
  var ASTRO_NAMES = {
    springEquinox: { name: 'Cónocht an Earraigh', english: 'spring equinox' },
    summerSolstice: { name: 'Grianstad an tSamhraidh', english: 'summer solstice' },
    autumnEquinox: { name: 'Cónocht an Fhómhair', english: 'autumn equinox' },
    winterSolstice: { name: 'Grianstad an Gheimhridh', english: 'winter solstice' }
  };
  // [month, day] in Ireland. DRAFT: verify against an almanac before launch.
  var ASTRO = {
    2026: { springEquinox: [3, 20], summerSolstice: [6, 21], autumnEquinox: [9, 23], winterSolstice: [12, 21] },
    2027: { springEquinox: [3, 20], summerSolstice: [6, 21], autumnEquinox: [9, 23], winterSolstice: [12, 21] },
    2028: { springEquinox: [3, 20], summerSolstice: [6, 20], autumnEquinox: [9, 22], winterSolstice: [12, 21] }
  };

  function utc(y, m, d) { return Date.UTC(y, m - 1, d); }

  // All key days from the year before to the year after, sorted by date.
  function list(y) {
    var out = [];
    for (var yr = y - 1; yr <= y + 1; yr++) {
      QUARTER.forEach(function (q) {
        out.push({ id: q.id + '-' + yr, key: q.id, name: q.name, english: q.english, kind: 'quarter', t: utc(yr, q.month, q.day) });
      });
      var a = ASTRO[yr];
      if (a) Object.keys(a).forEach(function (k) {
        out.push({ id: k + '-' + yr, key: k, name: ASTRO_NAMES[k].name, english: ASTRO_NAMES[k].english, kind: 'sun', t: utc(yr, a[k][0], a[k][1]) });
      });
    }
    return out.sort(function (x, y2) { return x.t - y2.t; });
  }

  // Next key day strictly after the given date, or the same day when includeToday is true.
  function next(y, m, d, includeToday) {
    var now = utc(y, m, d), all = list(y);
    for (var i = 0; i < all.length; i++) {
      if (all[i].t > now || (includeToday && all[i].t === now)) {
        return { festival: all[i], days: Math.round((all[i].t - now) / DAY) };
      }
    }
    return null;
  }

  // The next n key days from the date (today included).
  function upcoming(y, m, d, n) {
    var now = utc(y, m, d);
    return list(y).filter(function (f) { return f.t >= now; }).slice(0, n)
      .map(function (f) { return { festival: f, days: Math.round((f.t - now) / DAY) }; });
  }

  var api = { QUARTER: QUARTER, list: list, next: next, upcoming: upcoming };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Festivals = api;
})(typeof window !== 'undefined' ? window : this);
