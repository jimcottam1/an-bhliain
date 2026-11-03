(function () {
  var LAT = 52.66, LON = -8.63; // Limerick; a county picker comes later
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function irishToday() {
    var p = new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = +x.value; });
    return o;
  }
  // allow ?date=2026-11-03 for previews and testing
  function pickDate() {
    var m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(location.search);
    return m ? { year: +m[1], month: +m[2], day: +m[3] } : irishToday();
  }
  function hhmm(minUtc, y, mo, d) {
    var t = new Date(Date.UTC(y, mo - 1, d) + minUtc * 60000);
    return new Intl.DateTimeFormat('en-IE', { timeZone: 'Europe/Dublin', hour: '2-digit', minute: '2-digit', hour12: false }).format(t);
  }
  function dur(min) { var h = Math.floor(min / 60), m = Math.round(min % 60); return h + 'h ' + (m < 10 ? '0' : '') + m + 'm'; }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var t = pickDate(), y = t.year, m = t.month, d = t.day;
  var season = Wheel.seasonFor(y, m, d);
  Wheel.draw($('wheel'), y, m, d, [d + ' ' + MONTHS[m - 1].slice(0, 3), season.current.season, 'day ' + (season.daysSince + 1) + ' of the season']);
  $('wheel-caption').textContent = 'Samhain is at the top: the old year begins in the dark. The gold dot is today.';

  // light
  var s = Solar.sunTimes(y, m, d, LAT, LON), chg = Solar.dayLengthChangeSeconds(y, m, d, LAT, LON);
  $('rise').textContent = hhmm(s.sunrise, y, m, d);
  $('set').textContent = hhmm(s.sunset, y, m, d);
  $('len').textContent = dur(s.dayLength);
  var abs = Math.abs(chg), mm = Math.floor(abs / 60), ss = abs % 60;
  $('light-change').textContent = (mm ? mm + 'm ' : '') + ss + 's ' + (chg < 0 ? 'less' : 'more') + ' light than yesterday';
  var bar = $('bar-day');
  bar.style.left = (Math.max(0, s.sunrise) / 1440 * 100) + '%';
  bar.style.width = (s.dayLength / 1440 * 100) + '%';

  $('next').innerHTML = season.next.name + ' is in <b>' + season.daysToNext + ' days</b>.';

  // lore
  fetch('../data/lore.json').then(function (r) { return r.json(); }).then(function (data) {
    var e = data.entries.filter(function (x) { return x.month === m && x.day === d; })[0]
      || data.entries.filter(function (x) { return x.season === season.current.season; })[0];
    var box = $('lore');
    if (!e) { box.innerHTML = '<h2>Today</h2><p>No card for today yet. More are on the way.</p>'; return; }
    var src = e.sources.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    box.innerHTML =
      '<p class="label"><span class="kind ' + esc(e.kind.toLowerCase()) + '">' + esc(e.kind) + '</span>' +
      (e.status === 'draft' ? '<span class="draft">Draft, awaiting review</span>' : '') + '</p>' +
      '<h2>' + esc(e.title) + '</h2><p>' + esc(e.text) + '</p>' +
      '<p class="places"><b>Some places say:</b> ' + esc(e.someplacessay) + '</p>' +
      '<details><summary>Sources</summary><ul>' + src + '</ul></details>';
  }).catch(function () { $('lore').innerHTML = '<h2>Today</h2><p>The lore card could not load.</p>'; });
})();
