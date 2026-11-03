/* Wheel of the year: date maths (testable in Node) and the SVG drawing (browser only). */
(function (root) {
  var SEASONS = [
    { id: 'samhain', quarter: 'Samhain', irish: 'Geimhreadh', english: 'winter', month: 11, day: 1 },
    { id: 'imbolc', quarter: 'Imbolc', irish: 'Earrach', english: 'spring', month: 2, day: 1 },
    { id: 'bealtaine', quarter: 'Bealtaine', irish: 'Samhradh', english: 'summer', month: 5, day: 1 },
    { id: 'lughnasa', quarter: 'Lughnasa', irish: 'Fómhar', english: 'autumn', month: 8, day: 1 }
  ];
  var QUARTER_ENGLISH = { samhain: 'start of winter', imbolc: 'start of spring', bealtaine: 'start of summer', lughnasa: 'start of harvest' };
  var DAY = 86400000;
  function utc(y, m, d) { return Date.UTC(y, m - 1, d); }

  // The old year starts on 1 November. Returns start, end, progress (0 to 1) and day counts.
  function yearPosition(y, m, d) {
    var startYear = m >= 11 ? y : y - 1;
    var start = utc(startYear, 11, 1), end = utc(startYear + 1, 11, 1), now = utc(y, m, d);
    return { start: start, end: end, now: now, startYear: startYear, progress: (now - start) / (end - start),
             dayIndex: Math.round((now - start) / DAY), length: Math.round((end - start) / DAY) };
  }

  // The calendar date for a day index within the old year that began on 1 Nov of startYear.
  function dateFromIndex(startYear, index) {
    var t = new Date(utc(startYear, 11, 1) + index * DAY);
    return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
  }

  // Which season is current, which quarter day comes next, and how far away.
  function seasonFor(y, m, d) {
    var now = utc(y, m, d), best = null, next = null, bestT = -Infinity, nextT = Infinity;
    for (var yr = y - 1; yr <= y + 1; yr++) {
      SEASONS.forEach(function (q) {
        var t = utc(yr, q.month, q.day);
        if (t <= now && t > bestT) { bestT = t; best = q; }
        if (t > now && t < nextT) { nextT = t; next = q; }
      });
    }
    return { current: best, next: next, daysSince: Math.round((now - bestT) / DAY), daysToNext: Math.round((nextT - now) / DAY) };
  }

  // Angle in degrees clockwise from the top, with Samhain at the top.
  function angleFor(y, m, d) { return yearPosition(y, m, d).progress * 360; }

  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Spoken text for the slider, for example "Day 3 of the old year, 3 November 2026".
  function dayLabel(y, m, d) {
    return 'Day ' + (yearPosition(y, m, d).dayIndex + 1) + ' of the old year, ' + d + ' ' + MONTH_NAMES[m - 1] + ' ' + y;
  }

  // Text sizes in drawing units. The phone drawing is 640 units wide and shown about 362 px wide.
  var PHONE_SCALE = 362 / 640;
  var FONT = {
    phone: { irish: 24, english: 22, centreDate: 58, centreSeason: 34, centreSub: 24, tag: 21 },
    wide: { irish: 19, english: 15 }
  };

  var api = { MONTH_NAMES: MONTH_NAMES, dayLabel: dayLabel, FONT: FONT, PHONE_SCALE: PHONE_SCALE, SEASONS: SEASONS, QUARTER_ENGLISH: QUARTER_ENGLISH, yearPosition: yearPosition, dateFromIndex: dateFromIndex,
              seasonFor: seasonFor, angleFor: angleFor };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  /* ---- drawing (browser only) ---- */
  var NS = 'http://www.w3.org/2000/svg', C = 320;
  var MON = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, attrs, str) { var t = el('text', attrs, parent); t.textContent = str; return t; }
  function pt(r, deg) { var a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
  function angleOf(pos, y, m, d) { return (utc(y, m, d) - pos.start) / (pos.end - pos.start) * 360; }

  // opts: { compact: bool, onPick: function(seasonId) }
  function draw(svg, y, m, d, centre, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var R_OUT = compact ? 300 : 232, R_IN = compact ? 192 : 138;
    svg.setAttribute('viewBox', compact ? '0 0 640 640' : '-70 0 780 660');
    svg.innerHTML = '';
    function arc(a0, a1) {
      var p0 = pt(R_OUT, a0), p1 = pt(R_OUT, a1), p2 = pt(R_IN, a1), p3 = pt(R_IN, a0), big = (a1 - a0) > 180 ? 1 : 0;
      return 'M' + p0 + ' A' + R_OUT + ' ' + R_OUT + ' 0 ' + big + ' 1 ' + p1 + ' L' + p2 + ' A' + R_IN + ' ' + R_IN + ' 0 ' + big + ' 0 ' + p3 + ' Z';
    }
    var pos = yearPosition(y, m, d), cur = seasonFor(y, m, d).current;
    var angles = SEASONS.map(function (q) {
      return angleOf(pos, q.month >= 11 ? pos.startYear : pos.startYear + 1, q.month, q.day);
    });
    angles.push(360);

    var defs = el('defs', {}, svg);
    var glow = el('filter', { id: 'glow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
    el('feGaussianBlur', { stdDeviation: compact ? '8' : '6' }, glow);

    if (!compact) el('circle', { cx: C, cy: C, r: R_OUT + 22, fill: 'none', stroke: 'var(--line)', 'stroke-width': 1 }, svg);

    SEASONS.forEach(function (q, i) {
      var isCur = cur.id === q.id;
      var g = el('g', { 'class': 'wedge' + (isCur ? ' current' : ''), tabindex: '0', role: 'button',
        'aria-label': q.irish + ', ' + q.english + ', begins at ' + q.quarter + ' on 1 ' + MON[q.month] + '. Jump to that day.' }, svg);
      el('path', { d: arc(angles[i] + 0.6, angles[i + 1] - 0.6), fill: 'var(--' + q.english + ')', opacity: isCur ? 1 : 0.4 }, g);
      var mid = (angles[i] + angles[i + 1]) / 2, lp = pt((R_OUT + R_IN) / 2, mid);
      // centre the label in the band's horizontal width at that height, so long names stay inside
      var ldy = lp[1] - C, xo = Math.sqrt(Math.max(0, R_OUT * R_OUT - ldy * ldy)), xi = Math.abs(ldy) < R_IN ? Math.sqrt(R_IN * R_IN - ldy * ldy) : 0;
      lp[0] = C + (lp[0] > C ? 1 : -1) * ((xi + xo) / 2 - (compact ? 9 : 0));
      var cls = 'wl' + (isCur ? ' on' : '');
      var ti = text(g, { x: lp[0], y: lp[1] - (compact ? 6 : 4), 'text-anchor': 'middle', 'class': cls + ' ir' }, q.irish);
      var te = text(g, { x: lp[0], y: lp[1] + (compact ? 24 : 15), 'text-anchor': 'middle', 'class': cls + ' en' }, q.english);
      if (compact) { ti.setAttribute('style', 'font-size:' + FONT.phone.irish + 'px'); te.setAttribute('style', 'font-size:' + FONT.phone.english + 'px'); }
      if (opts.onPick) {
        var pick = function () { opts.onPick(q.id); };
        g.addEventListener('click', pick);
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
      }
    });

    // month ticks
    for (var mo = 0; mo < 12; mo++) {
      var calM = ((10 + mo) % 12) + 1;
      var a = angleOf(pos, calM >= 11 ? pos.startYear : pos.startYear + 1, calM, 1);
      var p0 = pt(R_OUT, a), p1 = pt(R_OUT + 8, a);
      el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: 'var(--muted)', 'stroke-width': 1 }, svg);
    }

    // quarter-day dividers, and names outside the ring on wide screens
    SEASONS.forEach(function (q, i) {
      var s0 = pt(R_IN - 8, angles[i]), s1 = pt(R_OUT + 12, angles[i]);
      el('line', { x1: s0[0], y1: s0[1], x2: s1[0], y2: s1[1], stroke: 'var(--ink)', 'stroke-width': 1.5, opacity: 0.7, 'pointer-events': 'none' }, svg);
      if (compact) return;
      var p = pt(R_OUT + 42, angles[i]);
      var anchor = (angles[i] > 20 && angles[i] < 160) ? 'start' : (angles[i] > 200 && angles[i] < 340) ? 'end' : 'middle';
      var dy = angles[i] < 20 ? -22 : (angles[i] > 160 && angles[i] < 200 ? 6 : -10);
      var gq = el('g', { 'class': 'qlabel' }, svg);
      text(gq, { x: p[0], y: p[1] + dy, 'text-anchor': anchor }, q.quarter);
      text(gq, { x: p[0], y: p[1] + dy + 19, 'text-anchor': anchor, 'class': 'sub' }, '1 ' + MON[q.month]);
      text(gq, { x: p[0], y: p[1] + dy + 37, 'text-anchor': anchor, 'class': 'sub' }, QUARTER_ENGLISH[q.id]);
    });

    // today marker
    var ang = pos.progress * 360, mp = pt((R_OUT + R_IN) / 2, ang), tp = pt(R_IN - 6, ang);
    var dot = compact ? 15 : 11;
    el('line', { x1: C, y1: C, x2: tp[0], y2: tp[1], stroke: 'var(--gold)', 'stroke-width': 1.5, 'stroke-dasharray': '3 6', opacity: 0.7, 'pointer-events': 'none' }, svg);
    el('circle', { cx: mp[0], cy: mp[1], r: dot + 7, fill: 'var(--gold)', filter: 'url(#glow)', opacity: 0.8, 'pointer-events': 'none' }, svg);
    el('circle', { cx: mp[0], cy: mp[1], r: dot, 'class': 'pulse', fill: 'none', stroke: 'var(--gold)', 'stroke-width': 3, 'pointer-events': 'none' }, svg);
    el('circle', { cx: mp[0], cy: mp[1], r: dot, fill: 'var(--gold)', stroke: 'var(--bg)', 'stroke-width': 3, 'pointer-events': 'none' }, svg);
    var tgp = pt(R_IN - (compact ? 34 : 26), ang);
    var tt = text(svg, { x: tgp[0], y: tgp[1] + 5, 'text-anchor': 'middle', 'class': 'todaytag' }, centre.tag || 'today');
    if (compact) tt.setAttribute('style', 'font-size:' + FONT.phone.tag + 'px');

    // centre
    var c1 = text(svg, { x: C, y: C - (compact ? 26 : 22), 'text-anchor': 'middle', 'class': 'c-date' }, centre.date);
    var c2 = text(svg, { x: C, y: C + (compact ? 16 : 14), 'text-anchor': 'middle', 'class': 'c-season' }, centre.season);
    var c3 = text(svg, { x: C, y: C + (compact ? 50 : 42), 'text-anchor': 'middle', 'class': 'c-sub' }, centre.sub);
    if (compact) { c1.setAttribute('style', 'font-size:' + FONT.phone.centreDate + 'px'); c2.setAttribute('style', 'font-size:' + FONT.phone.centreSeason + 'px'); c3.setAttribute('style', 'font-size:' + FONT.phone.centreSub + 'px'); }
  }
  root.Wheel = Object.assign(api, { draw: draw });
})(typeof window !== 'undefined' ? window : this);
