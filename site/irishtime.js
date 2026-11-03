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
  var api = { dateParts: dateParts, clock: clock, clockFromUtcMinutes: clockFromUtcMinutes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IrishTime = api;
})(typeof window !== 'undefined' ? window : this);
