/* Picks the lore card for a date: the entry for that day, or the nearest one. */
(function (root) {
  var DAY = 86400000;

  // Returns { entry, offset } where offset is days from the chosen date (negative = already passed).
  // Ties go to the upcoming entry.
  function nearest(entries, y, m, d) {
    var now = Date.UTC(y, m - 1, d), best = null;
    entries.forEach(function (e) {
      for (var yr = y - 1; yr <= y + 1; yr++) {
        var off = Math.round((Date.UTC(yr, e.month - 1, e.day) - now) / DAY);
        var score = Math.abs(off) + (off < 0 ? 0.5 : 0);
        if (!best || score < best.score) best = { entry: e, offset: off, score: score };
      }
    });
    return best ? { entry: best.entry, offset: best.offset } : null;
  }

  // The next few entries after the chosen date, for the "coming up" list.
  function comingUp(entries, y, m, d, n) {
    var now = Date.UTC(y, m - 1, d), rows = [];
    entries.forEach(function (e) {
      for (var yr = y; yr <= y + 1; yr++) {
        var off = Math.round((Date.UTC(yr, e.month - 1, e.day) - now) / DAY);
        if (off > 0) { rows.push({ entry: e, offset: off }); break; }
      }
    });
    rows.sort(function (a, b) { return a.offset - b.offset; });
    return rows.slice(0, n);
  }

  var api = { nearest: nearest, comingUp: comingUp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lore = api;
})(typeof window !== 'undefined' ? window : this);
