/* Picks the lore card for a date: the entry for that day, or the nearest one. Cards with holdBack: true are skipped. */
(function (root) {
  var DAY = 86400000;

  // Returns { entry, offset } where offset is days from the chosen date (negative = already passed).
  // Ties go to the upcoming entry.
  function shown(entries) { return entries.filter(function (e) { return !e.holdBack; }); }

  function nearest(entries, y, m, d) {
    entries = shown(entries);
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
    entries = shown(entries);
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

  // The small heading above a card. when/ago are tiny helpers for wording.
  function describe(offset, isToday, e, monthNames) {
    var date = e.day + ' ' + monthNames[e.month - 1];
    if (offset === 0) return isToday ? 'Today in the old year' : 'On this day';
    var rel = offset === 1 ? 'tomorrow' : offset === -1 ? 'yesterday' : offset > 0 ? 'in ' + offset + ' days' : (-offset) + ' days ago';
    return (isToday ? 'Nothing marked for today. ' : 'Nothing marked for this day. ') + 'Nearest card: ' + rel + ' (' + date + ')';
  }

  // One short, kind line for a card that is still a draft; nothing for an approved card.
  // The note depends on whether the sources are checked yet.
  function draftNote(entry) {
    if (!entry || entry.status !== 'draft') return '';
    return entry.sourcesChecked ? 'Sources checked; wording awaiting final review.' : 'We are still checking this card against its sources, so it may change.';
  }

  // The footer line about the lore as a whole.
  function footerNote(entries) {
    var drafts = (entries || []).filter(function (e) { return e.status === 'draft'; });
    if (!drafts.length) return '';
    if (drafts.some(function (e) { return !e.sourcesChecked; })) return 'Lore cards are drafts. We are still checking some against their sources, so the wording is not final yet.';
    return 'Lore cards are drafts. Their sources are checked, and the wording awaits final review.';
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // The HTML of a lore card. Everything that comes from the data is escaped.
  function cardHtml(e, head) {
    var src = e.sources.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var note = draftNote(e);
    return '<p class="kicker">' + esc(head) + '</p>' +
      '<p class="label"><span class="kind ' + esc(String(e.kind).toLowerCase()) + '">' + esc(e.kind) + '</span>' +
      (e.status === 'draft' ? '<span class="draft">Draft</span>' : '') + '</p>' +
      '<h2>' + esc(e.title) + '</h2><p>' + esc(e.text) + '</p>' +
      '<p class="places"><b>Some places say:</b> ' + esc(e.someplacessay) + '</p>' +
      (note ? '<p class="draftnote">' + esc(note) + '</p>' : '') +
      '<details><summary>Sources' + (e.sourcesChecked ? '' : ' (not yet checked)') + '</summary><ul>' + src + '</ul></details>';
  }

  var api = { nearest: nearest, comingUp: comingUp, describe: describe, draftNote: draftNote, footerNote: footerNote, cardHtml: cardHtml };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lore = api;
})(typeof window !== 'undefined' ? window : this);
