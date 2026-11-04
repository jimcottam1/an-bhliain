/* Sharing: the words, the link, and how to hand them over (share sheet, then clipboard,
   then a visible text box). Nothing here sends data anywhere by itself; the phone's own
   share sheet or the person's paste does that. Works in the browser (window.Share) and in Node. */
(function (root) {
  var isNode = typeof module !== 'undefined' && module.exports;
  // Look the other scripts up when they are needed, not when this file loads, so the
  // order of the script tags cannot break it.
  function dep(name, file) { return isNode ? require(file) : root[name]; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // 542 -> "9h 02m"
  function duration(min) {
    var total = Math.round(min), h = Math.floor(total / 60), m = total % 60;
    return h + 'h ' + pad(m) + 'm';
  }

  // "3 days after Samhain", "1 day after Samhain", or "the day of Samhain"
  function position(season) {
    var q = season.current.quarter;
    if (season.daysSince === 0) return 'the day of ' + q;
    return season.daysSince + (season.daysSince === 1 ? ' day' : ' days') + ' after ' + q;
  }

  // The one line we share: date, place in the old year, daylight in the chosen town.
  // It never includes lore text: cards are drafts until the owner approves them.
  function line(date, town) {
    var Wheel = dep('Wheel', './wheel.js'), Solar = dep('Solar', './solar.js');
    var season = Wheel.seasonFor(date.year, date.month, date.day);
    var t = Solar.sunTimes(date.year, date.month, date.day, town.lat, town.lon);
    return date.day + ' ' + Wheel.MONTH_NAMES[date.month - 1] + ' · ' + position(season) + ' · ' + duration(t.dayLength) + ' of daylight in ' + town.name;
  }

  // The page address, with ?date= only when the chosen day is not today. Web addresses only.
  function link(loc, date, today) {
    if (!loc || !/^https?:$/.test(loc.protocol)) return '';
    var base = loc.origin + loc.pathname;
    if (date.year === today.year && date.month === today.month && date.day === today.day) return base;
    return base + '?date=' + date.year + '-' + pad(date.month) + '-' + pad(date.day);
  }

  // A lore card may be shared only when it is approved and its sources are checked.
  function loreShareable(entry) {
    return !!entry && entry.status === 'approved' && entry.sourcesChecked === true;
  }

  // Hand the text over. Returns 'share', 'cancelled', 'clipboard' or 'box' (the caller then shows the text box).
  async function deliver(nav, payload) {
    var joined = payload.url ? payload.text + '\n' + payload.url : payload.text;
    if (nav && typeof nav.share === 'function') {
      try {
        var p = { title: payload.title, text: payload.text };
        if (payload.url) p.url = payload.url;
        await nav.share(p);
        return 'share';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
      }
    }
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
      try { await nav.clipboard.writeText(joined); return 'clipboard'; } catch (e) { /* fall through */ }
    }
    return 'box';
  }

  var api = { duration: duration, position: position, line: line, link: link, loreShareable: loreShareable, deliver: deliver };
  if (isNode) module.exports = api; else root.Share = api;
})(typeof window !== 'undefined' ? window : this);
