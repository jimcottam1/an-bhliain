(function () {
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MON = MONTHS.map(function (m) { return m.slice(0, 3); });
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function when(n) { return n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; }
  function ago(n) { return n === 0 ? 'today' : n === 1 ? 'yesterday' : n + ' days ago'; }
  function dur(min) { var h = Math.floor(min / 60), m = Math.round(min % 60); if (m === 60) { h++; m = 0; } return h + 'h ' + (m < 10 ? '0' : '') + m + 'm'; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ----- state -----
  // The real Irish today is kept apart from the day the page opens on (?date=, when it is good).
  var start = IrishTime.startDate(location.search, new Date());
  var today = start.today;
  var sel = { year: start.start.year, month: start.start.month, day: start.start.day };
  var town = TOWNS[0];
  var saved = store('anbhliain-town');
  TOWNS.forEach(function (t) { if (t.id === saved) town = t; });
  var lore = [];
  var mq = window.matchMedia('(max-width: 760px)');

  function isToday() { return sel.year === today.year && sel.month === today.month && sel.day === today.day; }
  function setDate(o) { sel = { year: o.year, month: o.month, day: o.day }; render(); }

  // ----- town picker -----
  var sel$ = $('town');
  TOWNS.forEach(function (t) { var o = document.createElement('option'); o.value = t.id; o.textContent = t.name; sel$.appendChild(o); });
  sel$.value = town.id;
  sel$.addEventListener('change', function () {
    TOWNS.forEach(function (t) { if (t.id === sel$.value) town = t; });
    store('anbhliain-town', town.id);
    render();
  });

  // ----- controls -----
  function shift(n) {
    var pos = Wheel.yearPosition(sel.year, sel.month, sel.day);
    setDate(Wheel.dateFromIndex(pos.startYear, pos.dayIndex + n));
  }
  $('prev').addEventListener('click', function () { shift(-1); });
  $('nextday').addEventListener('click', function () { shift(1); });
  $('today').addEventListener('click', function () { setDate(today); });
  $('day').addEventListener('input', function () {
    var pos = Wheel.yearPosition(sel.year, sel.month, sel.day);
    setDate(Wheel.dateFromIndex(pos.startYear, +$('day').value));
  });
  mq.addEventListener ? mq.addEventListener('change', function () { render(); }) : mq.addListener(function () { render(); });

  function pickSeason(id) {
    var pos = Wheel.yearPosition(sel.year, sel.month, sel.day), q = Wheel.SEASONS.filter(function (s) { return s.id === id; })[0];
    setDate({ year: q.month >= 11 ? pos.startYear : pos.startYear + 1, month: q.month, day: q.day });
  }

  // ----- render pieces -----
  function renderWheel() {
    var season = Wheel.seasonFor(sel.year, sel.month, sel.day), c = season.current;
    Wheel.draw($('wheel'), sel.year, sel.month, sel.day, {
      date: sel.day + ' ' + MON[sel.month - 1],
      season: c.irish,
      sub: c.english + ', day ' + (season.daysSince + 1),
      tag: isToday() ? 'today' : 'chosen'
    }, { compact: mq.matches, onPick: pickSeason });
    var pos = Wheel.yearPosition(sel.year, sel.month, sel.day);
    var slider = $('day');
    slider.max = String(pos.length - 1);
    slider.value = String(pos.dayIndex);
    slider.setAttribute('aria-valuetext', Wheel.dayLabel(sel.year, sel.month, sel.day));
    $('today').hidden = isToday();
    $('scrub-note').textContent = isToday() ? 'Drag the slider, or tap a season, to explore the year.'
      : 'Showing ' + sel.day + ' ' + MONTHS[sel.month - 1] + ' ' + sel.year + '. The Today button brings you back.';
  }

  function renderNextFestival() {
    var nf = Festivals.next(sel.year, sel.month, sel.day, true);
    if (!nf) { $('nf-name').textContent = ''; $('nf-count').textContent = ''; return; }
    var t = new Date(nf.festival.t);
    $('nf-name').innerHTML = esc(nf.festival.name) + ' <span class="en">' + esc(nf.festival.english) + '</span>';
    $('nf-count').innerHTML = '<b>' + (nf.days === 0 ? (isToday() ? 'Today' : 'This day') : nf.days === 1 ? 'Tomorrow' : nf.days + ' days') + '</b> · ' +
      t.getUTCDate() + ' ' + MONTHS[t.getUTCMonth()] + ' ' + t.getUTCFullYear();
  }

  function renderLight() {
    var y = sel.year, m = sel.month, d = sel.day;
    var s = Solar.sunTimes(y, m, d, town.lat, town.lon), chg = Solar.dayLengthChangeSeconds(y, m, d, town.lat, town.lon);
    $('light-town').textContent = town.name;
    $('rise').textContent = IrishTime.clockFromUtcMinutes(s.sunrise, y, m, d);
    $('set').textContent = IrishTime.clockFromUtcMinutes(s.sunset, y, m, d);
    $('len').textContent = dur(s.dayLength);
    var abs = Math.abs(chg), mm = Math.floor(abs / 60), ss = abs % 60;
    $('light-change').textContent = (mm ? mm + 'm ' : '') + ss + 's ' + (chg < 0 ? 'less' : 'more') + ' light than ' + (isToday() ? 'yesterday' : 'the day before');
    // The bar spans the Irish clock day, so it is drawn from the Irish clock times
    var rise = IrishTime.clockFromUtcMinutes(s.sunrise, y, m, d).split(':'), set = IrishTime.clockFromUtcMinutes(s.sunset, y, m, d).split(':');
    var r = (+rise[0]) * 60 + (+rise[1]), e = (+set[0]) * 60 + (+set[1]);
    $('bar-day').style.left = (r / 1440 * 100) + '%';
    $('bar-day').style.width = ((e - r) / 1440 * 100) + '%';
  }

  function renderLore() {
    var box = $('lore');
    var hit = Lore.nearest(lore, sel.year, sel.month, sel.day);
    if (!hit) { box.innerHTML = '<h2>Lore</h2><p>No lore cards loaded.</p>'; return; }
    var e = hit.entry, head = Lore.describe(hit.offset, isToday(), e, MONTHS);
    box.innerHTML = Lore.cardHtml(e, head);
  }

  function jumpButton(label, sub, o) {
    var li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = '<span class="fn">' + esc(label) + '</span><span class="fs">' + esc(sub) + '</span>';
    b.addEventListener('click', function () { setDate(o); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    li.appendChild(b);
    return li;
  }

  function renderLists() {
    var ul = $('fest-list'); ul.innerHTML = '';
    Festivals.upcoming(sel.year, sel.month, sel.day, 6).forEach(function (u) {
      var t = new Date(u.festival.t);
      ul.appendChild(jumpButton(u.festival.name + ' · ' + u.festival.english,
        t.getUTCDate() + ' ' + MON[t.getUTCMonth()] + ' · ' + when(u.days),
        { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }));
    });
    var up = $('up-list'); up.innerHTML = '';
    Lore.comingUp(lore, sel.year, sel.month, sel.day, 5).forEach(function (u) {
      var e = u.entry, t = new Date(Date.UTC(sel.year, sel.month - 1, sel.day) + u.offset * 86400000);
      up.appendChild(jumpButton(e.title, e.kind + ' · ' + e.day + ' ' + MON[e.month - 1] + ' · ' + when(u.offset),
        { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }));
    });
  }

  function renderQuarters() {
    var ul = $('quarters'), pos = Wheel.yearPosition(sel.year, sel.month, sel.day), cur = Wheel.seasonFor(sel.year, sel.month, sel.day).current;
    ul.innerHTML = '';
    Festivals.quarterDays(pos.startYear).forEach(function (q) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button';
      if (q.id === cur.id) b.setAttribute('aria-current', 'true');
      b.innerHTML = '<span class="fn">' + esc(q.name) + '</span><span class="fs">1 ' + MON[q.month - 1] + ' · ' + esc(q.english) + '</span>';
      b.addEventListener('click', function () { setDate({ year: q.year, month: q.month, day: q.day }); });
      li.appendChild(b); ul.appendChild(li);
    });
  }

  function renderCurve() {
    var svg = $('curve'), pos = Wheel.yearPosition(sel.year, sel.month, sel.day);
    var L = 44, R = 590, T = 16, B = 172, vals = [], i, min = 1e9, max = -1e9, minI = 0, maxI = 0;
    for (i = 0; i < pos.length; i++) {
      var dd = Wheel.dateFromIndex(pos.startYear, i), v = Solar.sunTimes(dd.year, dd.month, dd.day, town.lat, town.lon).dayLength / 60;
      vals.push(v);
      if (v < min) { min = v; minI = i; }
      if (v > max) { max = v; maxI = i; }
    }
    var lo = Math.floor(min) - 0.5, hi = Math.ceil(max) + 0.5;
    function X(k) { return L + (R - L) * k / (pos.length - 1); }
    function Y(v) { return B - (B - T) * (v - lo) / (hi - lo); }
    var d = vals.map(function (v, k) { return (k ? 'L' : 'M') + X(k).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    var html = '';
    for (var h = Math.ceil(lo); h <= Math.floor(hi); h += 2) {
      html += '<line x1="' + L + '" x2="' + R + '" y1="' + Y(h) + '" y2="' + Y(h) + '" class="grid"/><text x="' + (L - 6) + '" y="' + (Y(h) + 5) + '" text-anchor="end" class="axis">' + h + 'h</text>';
    }
    [[11, 'Nov'], [1, 'Jan'], [3, 'Mar'], [5, 'May'], [7, 'Jul'], [9, 'Sep']].forEach(function (mo) {
      var yr = mo[0] >= 11 ? pos.startYear : pos.startYear + 1;
      var k = Math.round((Date.UTC(yr, mo[0] - 1, 1) - pos.start) / 86400000);
      html += '<text x="' + X(k) + '" y="' + (B + 20) + '" text-anchor="middle" class="axis">' + mo[1] + '</text>';
    });
    html += '<path d="' + d + '" class="line"/>';
    html += '<line x1="' + X(pos.dayIndex) + '" x2="' + X(pos.dayIndex) + '" y1="' + T + '" y2="' + B + '" class="today"/>';
    html += '<circle cx="' + X(pos.dayIndex) + '" cy="' + Y(vals[pos.dayIndex]) + '" r="6" class="dot"/>';
    svg.innerHTML = html;
    $('curve-note').textContent = town.name + ': from ' + dur(min * 60) + ' on the shortest day to ' + dur(max * 60) + ' on the longest.';
  }

  // ----- sharing -----
  function clearShare() { $('share-msg').textContent = ''; $('share-box').hidden = true; }
  $('share').addEventListener('click', function () {
    var link = Share.link(location, sel, today);
    var payload = { title: 'An Bhliain', text: Share.line(sel, town), url: link };
    Share.deliver(navigator, payload).then(function (how) {
      if (how === 'clipboard') $('share-msg').textContent = 'Copied. Paste it wherever you like.';
      else if (how === 'box') {
        var box = $('share-box');
        box.value = link ? payload.text + '\n' + link : payload.text;
        box.hidden = false;
        $('share-msg').textContent = 'Copy this text to share it.';
        box.focus(); box.select();
      }
    });
  });

  function render() {
    clearShare();
    renderWheel(); renderQuarters(); renderNextFestival(); renderLight(); renderLore(); renderLists(); renderCurve();
  }

  // the lower panels are open on wide screens and folded on phones
  function setPanels() { ['p-fest', 'p-curve', 'p-up'].forEach(function (id) { var d = $(id); if (mq.matches) d.removeAttribute('open'); else d.setAttribute('open', ''); }); }
  setPanels();
  mq.addEventListener ? mq.addEventListener('change', setPanels) : mq.addListener(setPanels);

  render();
  fetch('data/lore.json').then(function (r) { return r.json(); }).then(function (data) {
    lore = data.entries;
    var ln = $('lorenote'); if (ln) { var t = Lore.footerNote(lore); ln.textContent = t; ln.hidden = !t; }
    render();
  }).catch(function () { $('lore').innerHTML = '<h2>Lore</h2><p>The lore cards could not load.</p>'; });
})();
