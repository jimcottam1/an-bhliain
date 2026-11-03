/* Wheel of the year: date maths (testable in Node) and the SVG drawing (browser only). */
(function (root) {
  var QUARTERS = [
    { id: 'samhain', name: 'Samhain', season: 'Geimhreadh', month: 11, day: 1, en: 'winter' },
    { id: 'imbolc', name: 'Imbolc', season: 'Earrach', month: 2, day: 1, en: 'spring' },
    { id: 'bealtaine', name: 'Bealtaine', season: 'Samhradh', month: 5, day: 1, en: 'summer' },
    { id: 'lughnasa', name: 'Lughnasa', season: 'Fómhar', month: 8, day: 1, en: 'autumn' }
  ];
  var DAY = 86400000;
  function utc(y, m, d) { return Date.UTC(y, m - 1, d); }

  // The old year starts on 1 November. Returns start, end, progress (0 to 1) and day counts.
  function yearPosition(y, m, d) {
    var startYear = m >= 11 ? y : y - 1;
    var start = utc(startYear, 11, 1), end = utc(startYear + 1, 11, 1), now = utc(y, m, d);
    return { start: start, end: end, now: now, startYear: startYear, progress: (now - start) / (end - start),
             dayIndex: Math.round((now - start) / DAY), length: Math.round((end - start) / DAY) };
  }

  // Which quarter day began the current season, and which comes next.
  function seasonFor(y, m, d) {
    var now = utc(y, m, d), best = null, next = null, bestT = -Infinity, nextT = Infinity;
    for (var yr = y - 1; yr <= y + 1; yr++) {
      QUARTERS.forEach(function (q) {
        var t = utc(yr, q.month, q.day);
        if (t <= now && t > bestT) { bestT = t; best = q; }
        if (t > now && t < nextT) { nextT = t; next = q; }
      });
    }
    return { current: best, next: next, daysSince: Math.round((now - bestT) / DAY), daysToNext: Math.round((nextT - now) / DAY) };
  }

  // Angle in degrees clockwise from the top, with Samhain at the top.
  function angleFor(y, m, d) { return yearPosition(y, m, d).progress * 360; }

  var api = { QUARTERS: QUARTERS, yearPosition: yearPosition, seasonFor: seasonFor, angleFor: angleFor };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  /* ---- drawing (browser only) ---- */
  var NS = 'http://www.w3.org/2000/svg', C = 320, R_OUT = 232, R_IN = 156;
  var COLOURS = { samhain: 'var(--winter)', imbolc: 'var(--spring)', bealtaine: 'var(--summer)', lughnasa: 'var(--autumn)' };
  var MON = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function pt(r, deg) { var a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
  function arc(a0, a1) {
    var p0 = pt(R_OUT, a0), p1 = pt(R_OUT, a1), p2 = pt(R_IN, a1), p3 = pt(R_IN, a0), big = (a1 - a0) > 180 ? 1 : 0;
    return 'M' + p0 + ' A' + R_OUT + ' ' + R_OUT + ' 0 ' + big + ' 1 ' + p1 + ' L' + p2 + ' A' + R_IN + ' ' + R_IN + ' 0 ' + big + ' 0 ' + p3 + ' Z';
  }
  function angleOf(pos, y, m, d) { return (utc(y, m, d) - pos.start) / (pos.end - pos.start) * 360; }

  function draw(svg, y, m, d, centreLines) {
    svg.innerHTML = '';
    var pos = yearPosition(y, m, d), cur = seasonFor(y, m, d).current;
    var order = ['samhain', 'imbolc', 'bealtaine', 'lughnasa'];
    var angles = QUARTERS.map(function (q) {
      return angleOf(pos, q.month >= 11 ? pos.startYear : pos.startYear + 1, q.month, q.day);
    });
    angles.push(360);

    var defs = el('defs', {}, svg);
    var glow = el('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
    el('feGaussianBlur', { stdDeviation: '6' }, glow);

    el('circle', { cx: C, cy: C, r: R_OUT + 22, fill: 'none', stroke: 'var(--line)', 'stroke-width': 1 }, svg);
    order.forEach(function (id, i) {
      var q = QUARTERS[i], isCur = cur.id === id;
      el('path', { d: arc(angles[i] + 0.6, angles[i + 1] - 0.6), fill: COLOURS[id], opacity: isCur ? 1 : 0.38 }, svg);
      var mid = (angles[i] + angles[i + 1]) / 2, lp = pt((R_OUT + R_IN) / 2, mid);
      var t = el('text', { x: lp[0], y: lp[1], 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'class': 'seasonlabel' + (isCur ? ' on' : '') }, svg);
      t.textContent = q.season;
    });

    // month ticks
    for (var mo = 0; mo < 12; mo++) {
      var calM = ((10 + mo) % 12) + 1;
      var a = angleOf(pos, calM >= 11 ? pos.startYear : pos.startYear + 1, calM, 1);
      var p0 = pt(R_OUT, a), p1 = pt(R_OUT + 8, a);
      el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: 'var(--muted)', 'stroke-width': 1 }, svg);
    }

    // quarter-day names outside the ring
    order.forEach(function (id, i) {
      var q = QUARTERS[i], p = pt(R_OUT + 44, angles[i]);
      var anchor = (angles[i] > 20 && angles[i] < 160) ? 'start' : (angles[i] > 200 && angles[i] < 340) ? 'end' : 'middle';
      var g = el('g', { 'class': 'qlabel' }, svg);
      var t1 = el('text', { x: p[0], y: p[1] - 2, 'text-anchor': anchor }, g); t1.textContent = q.name;
      var t2 = el('text', { x: p[0], y: p[1] + 16, 'text-anchor': anchor, 'class': 'sub' }, g); t2.textContent = '1 ' + MON[q.month];
      var s0 = pt(R_IN - 10, angles[i]), s1 = pt(R_OUT + 14, angles[i]);
      el('line', { x1: s0[0], y1: s0[1], x2: s1[0], y2: s1[1], stroke: 'var(--ink)', 'stroke-width': 1.5, opacity: 0.7 }, svg);
    });

    // today marker
    var ang = pos.progress * 360, mp = pt((R_OUT + R_IN) / 2, ang), tp = pt(R_IN - 6, ang);
    el('line', { x1: C, y1: C, x2: tp[0], y2: tp[1], stroke: 'var(--gold)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5', opacity: 0.7 }, svg);
    el('circle', { cx: mp[0], cy: mp[1], r: 16, fill: 'var(--gold)', filter: 'url(#glow)', opacity: 0.8 }, svg);
    el('circle', { cx: mp[0], cy: mp[1], r: 9, fill: 'var(--gold)', stroke: 'var(--bg)', 'stroke-width': 3 }, svg);

    // centre
    var c1 = el('text', { x: C, y: C - 22, 'text-anchor': 'middle', 'class': 'c-date' }, svg); c1.textContent = centreLines[0];
    var c2 = el('text', { x: C, y: C + 14, 'text-anchor': 'middle', 'class': 'c-season' }, svg); c2.textContent = centreLines[1];
    var c3 = el('text', { x: C, y: C + 44, 'text-anchor': 'middle', 'class': 'c-sub' }, svg); c3.textContent = centreLines[2];
  }
  root.Wheel = Object.assign(api, { draw: draw });
})(typeof window !== 'undefined' ? window : this);
