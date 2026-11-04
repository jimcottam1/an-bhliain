const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Share = require('../site/share.js');
const Lore = require('../site/lore.js');
const lore = require('../site/data/lore.json');

const SITE = path.join(__dirname, '..', 'site');
const LIMERICK = { name: 'Limerick', lat: 52.66, lon: -8.63 };

// ---------- the words ----------
test('the share line gives the date, the days since the last quarter day, and the daylight', () => {
  const t = Share.line({ year: 2026, month: 11, day: 4 }, LIMERICK);
  assert.match(t, /^4 November · 3 days after Samhain · 9h \d\dm of daylight in Limerick$/);
});

test('on the quarter day itself it says so, and one day later it is singular', () => {
  assert.match(Share.line({ year: 2026, month: 11, day: 1 }, LIMERICK), /^1 November · the day of Samhain · /);
  assert.match(Share.line({ year: 2026, month: 11, day: 2 }, LIMERICK), /^2 November · 1 day after Samhain · /);
  assert.match(Share.line({ year: 2027, month: 2, day: 1 }, LIMERICK), /^1 February · the day of Imbolc · /);
});

test('the day before Samhain counts from Lughnasa; the town name and daylight change with the town', () => {
  assert.match(Share.line({ year: 2026, month: 10, day: 31 }, LIMERICK), /^31 October · 91 days after Lughnasa · /);
  const cork = Share.line({ year: 2026, month: 12, day: 21 }, { name: 'Letterkenny', lat: 54.95, lon: -7.73 });
  assert.match(cork, /of daylight in Letterkenny$/);
  assert.match(cork, /^21 December · 50 days after Samhain · 7h /);
});

test('daylight is formatted as hours and two-digit minutes', () => {
  assert.strictEqual(Share.duration(542), '9h 02m');
  assert.strictEqual(Share.duration(600), '10h 00m');
  assert.strictEqual(Share.duration(1019.6), '17h 00m'); // rounds up across the hour
});

test('the share text never contains any lore card (they are drafts), on any day of the year, in any town', () => {
  for (let i = 0; i < 365; i++) {
    const t = new Date(Date.UTC(2026, 10, 1 + i));
    const s = Share.line({ year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }, LIMERICK);
    for (const e of lore.entries) {
      if (e.title.length > 12) assert.ok(!s.includes(e.title), 'title of ' + e.id); // short titles are bare festival names, which the line may name
      assert.ok(!s.includes(e.text.slice(0, 25)), 'text of ' + e.id);
    }
  }
});

test('a lore card may be shared only once it is approved: not draft, and its sources checked', () => {
  assert.strictEqual(Share.loreShareable({ status: 'draft', sourcesChecked: false }), false);
  assert.strictEqual(Share.loreShareable({ status: 'draft', sourcesChecked: true }), false);
  assert.strictEqual(Share.loreShareable({ status: 'approved', sourcesChecked: false }), false);
  assert.strictEqual(Share.loreShareable({ status: 'approved', sourcesChecked: true }), true);
  assert.strictEqual(Share.loreShareable(null), false);
});

// ---------- the link ----------
const LOC = { protocol: 'https:', origin: 'https://example.github.io', pathname: '/an-bhliain/', search: '?v=1&town=x', hash: '#top' };

test('the link is the page address without extras when sharing today', () => {
  assert.strictEqual(Share.link(LOC, { year: 2026, month: 11, day: 4 }, { year: 2026, month: 11, day: 4 }), 'https://example.github.io/an-bhliain/');
});

test('the link carries the chosen date when it is not today, zero-padded', () => {
  assert.strictEqual(Share.link(LOC, { year: 2027, month: 2, day: 1 }, { year: 2026, month: 11, day: 4 }), 'https://example.github.io/an-bhliain/?date=2027-02-01');
});

test('no link for a file: or other non-web address', () => {
  assert.strictEqual(Share.link({ protocol: 'file:', origin: 'null', pathname: '/x/index.html', search: '', hash: '' }, { year: 2026, month: 11, day: 4 }, { year: 2026, month: 11, day: 4 }), '');
  assert.strictEqual(Share.link({ protocol: 'javascript:', origin: 'null', pathname: 'x', search: '', hash: '' }, { year: 2026, month: 11, day: 4 }, { year: 2026, month: 11, day: 4 }), '');
});

// ---------- delivery: share sheet, then clipboard, then a visible box ----------
const payload = { title: 'An Bhliain', text: '4 November · 3 days after Samhain · 9h 26m of daylight in Limerick', url: 'https://example.github.io/an-bhliain/' };
const joined = payload.text + '\n' + payload.url;

test('delivery uses the share sheet first and passes the text and link separately', async () => {
  const calls = [];
  const nav = { share: async (p) => { calls.push(p); }, clipboard: { writeText: async () => { calls.push('clipboard'); } } };
  assert.strictEqual(await Share.deliver(nav, payload), 'share');
  assert.deepStrictEqual(calls, [{ title: payload.title, text: payload.text, url: payload.url }]);
});

test('closing the share sheet is not an error and does not fall through to the clipboard', async () => {
  let copied = false;
  const nav = { share: async () => { const e = new Error('closed'); e.name = 'AbortError'; throw e; }, clipboard: { writeText: async () => { copied = true; } } };
  assert.strictEqual(await Share.deliver(nav, payload), 'cancelled');
  assert.strictEqual(copied, false);
});

test('if the share sheet fails for another reason, the clipboard is tried', async () => {
  let text = null;
  const nav = { share: async () => { throw new Error('not allowed'); }, clipboard: { writeText: async (t) => { text = t; } } };
  assert.strictEqual(await Share.deliver(nav, payload), 'clipboard');
  assert.strictEqual(text, joined);
});

test('with no share sheet, the clipboard gets the line and the link on two lines', async () => {
  let text = null;
  assert.strictEqual(await Share.deliver({ clipboard: { writeText: async (t) => { text = t; } } }, payload), 'clipboard');
  assert.strictEqual(text, joined);
});

test('if the clipboard is blocked, or missing, a visible text box is the last resort', async () => {
  assert.strictEqual(await Share.deliver({ clipboard: { writeText: async () => { throw new Error('denied'); } } }, payload), 'box');
  assert.strictEqual(await Share.deliver({}, payload), 'box');
  assert.strictEqual(await Share.deliver(undefined, payload), 'box');
});

test('with no link (a file: page) the clipboard text is just the line', async () => {
  let text = null;
  await Share.deliver({ clipboard: { writeText: async (t) => { text = t; } } }, { title: 'An Bhliain', text: payload.text, url: '' });
  assert.strictEqual(text, payload.text);
});

// ---------- the share picture and page tags ----------
const html = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const meta = (key) => { const m = html.match(new RegExp('<meta (?:property|name)="' + key + '" content="([^"]*)"')); return m && m[1]; };

test('the page has share-preview tags with an absolute https image address', () => {
  assert.strictEqual(meta('og:type'), 'website');
  assert.strictEqual(meta('og:title'), 'An Bhliain');
  assert.ok(meta('og:description') && meta('og:description').length > 40);
  assert.match(meta('og:image'), /^https:\/\/[^ ]+\/og\.png$/);
  assert.strictEqual(meta('og:image:width'), '1200');
  assert.strictEqual(meta('og:image:height'), '630');
  assert.ok(meta('og:image:alt') && meta('og:image:alt').length > 20);
  assert.strictEqual(meta('twitter:card'), 'summary_large_image');
});

test('og.png is a real 1200 x 630 PNG of reasonable size, and og.svg is its source picture', () => {
  const png = fs.readFileSync(path.join(SITE, 'og.png'));
  assert.strictEqual(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.strictEqual(png.readUInt32BE(16), 1200);
  assert.strictEqual(png.readUInt32BE(20), 630);
  assert.ok(png.length > 8000 && png.length < 400000, 'size ' + png.length);
  const svg = fs.readFileSync(path.join(SITE, 'og.svg'), 'utf8');
  assert.match(svg, /^<svg [^>]*viewBox="0 0 1200 630"/);
  for (const w of ['Samhain', 'Imbolc', 'Bealtaine', 'Lughnasa']) assert.ok(svg.includes(w), w);
});

test('the share button, its message and its text box are in the page, labelled', () => {
  assert.match(html, /<button type="button" id="share"[^>]*>/);
  assert.match(html, /id="share-msg"[^>]*aria-live="polite"/);
  assert.match(html, /<textarea id="share-box"[^>]*readonly[^>]*aria-label="[^"]+"/);
  assert.match(html, /<script src="share\.js"><\/script>/);
});

// ---------- the draft note ----------
test('a draft card gets one short, kind line saying it is still being checked', () => {
  const n = Lore.draftNote({ status: 'draft' });
  assert.strictEqual(n, 'We are still checking this card against its sources, so it may change.');
  assert.ok(n.length < 90);
});

test('an approved card gets no draft note', () => {
  assert.strictEqual(Lore.draftNote({ status: 'approved' }), '');
  assert.strictEqual(Lore.draftNote({}), '');
});

test('a draft card shows the note and a Draft tag; an approved card shows neither', () => {
  const e = { kind: 'Tradition', title: 'T', text: 'x', someplacessay: 'y', sources: ['a source'], status: 'draft', sourcesChecked: false };
  const d = Lore.cardHtml(e, 'Today');
  assert.ok(d.includes('<p class="draftnote">We are still checking this card against its sources, so it may change.</p>'));
  assert.ok(d.includes('<span class="draft">Draft</span>'));
  assert.ok(d.includes('Sources (not yet checked)'));
  const a = Lore.cardHtml(Object.assign({}, e, { status: 'approved', sourcesChecked: true }), 'Today');
  assert.ok(!a.includes('draftnote') && !a.includes('Draft') && !a.includes('not yet checked'));
});

test('card text from the data is escaped on the page', () => {
  const e = { kind: 'Fact', title: '<img src=x onerror=alert(1)>', text: 'a & b "q"', someplacessay: "<b>y</b>", sources: ['<script>x</script>'], status: 'draft' };
  const h = Lore.cardHtml(e, '<i>head</i>');
  assert.ok(!h.includes('<img') && !h.includes('<script') && !h.includes('<i>head'));
  assert.ok(h.includes('&lt;img') && h.includes('a &amp; b &quot;q&quot;'));
});

test('the app builds the card with Lore.cardHtml, and the footer says the lore is still being checked (wording follows the data)', () => {
  const app = fs.readFileSync(path.join(SITE, 'app.js'), 'utf8');
  assert.ok(app.includes('Lore.cardHtml(e, head)'));
  assert.match(html, /still checking some against their sources/);
});

test('every script the page loads is valid JavaScript (a stray newline in a string once broke app.js)', () => {
  const vm = require('node:vm');
  for (const f of fs.readdirSync(SITE).filter((n) => n.endsWith('.js'))) {
    assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(SITE, f), 'utf8'), { filename: f }), f);
  }
});

test('the scripts work when loaded in the order the page loads them, with no Node require (browser-style)', () => {
  const vm = require('node:vm');
  const order = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]).filter((s) => s !== 'app.js');
  const win = { Intl, Date, Math, JSON, Object, Array, String, Number };
  win.window = win;
  const ctx = vm.createContext(win);
  for (const f of order) vm.runInContext(fs.readFileSync(path.join(SITE, f), 'utf8'), ctx, { filename: f });
  const line = vm.runInContext("window.Share.line({ year: 2026, month: 11, day: 4 }, { name: 'Limerick', lat: 52.66, lon: -8.63 })", ctx);
  assert.match(line, /^4 November · 3 days after Samhain · /);
});
