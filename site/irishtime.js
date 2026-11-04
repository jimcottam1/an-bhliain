/* Irish clock (Europe/Dublin, so summer time is handled by the browser).
   Works in the browser (window.IrishTime) and in Node (module.exports). */
(function (root) {
  function dateParts(dt) {
    var p = new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(dt);
    var o = {};
    p.forEach(function (x) { o[x.type] = +x.value; });
    return { year: o.year, month: o.month, day: o.day };
  }
  function clock(dt) {
    return new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(dt);
  }
  // minutes after 00:00 UTC on the given calendar date, shown as an Irish clock time
  function clockFromUtcMinutes(minUtc, y, m, d) {
    return clock(new Date(Date.UTC(y, m - 1, d) + Math.round(minUtc) * 60000));
  }
  // Reads ?date=YYYY-MM-DD strictly: the whole value must match, the date must exist
  // (checked by a round trip through Date.UTC), and the year must be 1900 to 2100.
  // Anything else gives null, and the caller falls back to today.
  function parseDateParam(search) {
    var m = /(?:^|[?&])date=(\d{4})-(\d{2})-(\d{2})(?:&|#|$)/.exec(search || '');
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1900 || y > 2100) return null;
    var t = new Date(Date.UTC(y, mo - 1, d));
    if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
    return { year: y, month: mo, day: d };
  }

  // The real Irish today, and the day to open on (from ?date= when it is good). Kept apart so
  // "today", the Today button and the share link always mean the real today.
  function startDate(search, now) {
    var today = dateParts(now);
    return { today: today, start: parseDateParam(search) || today };
  }

  var api = { dateParts: dateParts, clock: clock, clockFromUtcMinutes: clockFromUtcMinutes, parseDateParam: parseDateParam, startDate: startDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IrishTime = api;
})(typeof window !== 'undefined' ? window : this);
