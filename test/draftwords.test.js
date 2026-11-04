const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const Lore = require('../site/lore.js');

const UNCHECKED = 'We are still checking this card against its sources, so it may change.';
const CHECKED = 'Sources checked; wording awaiting final review.';

test('a draft card whose sources are not yet checked says it is still being checked', () => {
  assert.strictEqual(Lore.draftNote({ status: 'draft', sourcesChecked: false }), UNCHECKED);
  assert.strictEqual(Lore.draftNote({ status: 'draft' }), UNCHECKED);
});

test('a draft card whose sources are checked says the wording awaits final review', () => {
  assert.strictEqual(Lore.draftNote({ status: 'draft', sourcesChecked: true }), CHECKED);
});

test('an approved card has no draft note', () => {
  assert.strictEqual(Lore.draftNote({ status: 'approved', sourcesChecked: true }), '');
  assert.strictEqual(Lore.draftNote({ status: 'approved', sourcesChecked: false }), '');
});

test('the card shows the right note and the right sources heading for each state', () => {
  const base = { kind: 'Fact', title: 'T', text: 'x', someplacessay: 'y', sources: ['a source'] };
  const a = Lore.cardHtml(Object.assign({}, base, { status: 'draft', sourcesChecked: false }), 'h');
  assert.ok(a.includes(UNCHECKED) && a.includes('Sources (not yet checked)'));
  const b = Lore.cardHtml(Object.assign({}, base, { status: 'draft', sourcesChecked: true }), 'h');
  assert.ok(b.includes(CHECKED) && !b.includes(UNCHECKED) && !b.includes('not yet checked') && b.includes('<span class="draft">Draft</span>'));
  const c = Lore.cardHtml(Object.assign({}, base, { status: 'approved', sourcesChecked: true }), 'h');
  assert.ok(!c.includes('draftnote') && !c.includes('Draft'));
});

const FOOT_A = 'Lore cards are drafts. We are still checking some against their sources, so the wording is not final yet.';
const FOOT_B = 'Lore cards are drafts. Their sources are checked, and the wording awaits final review.';

test('the footer note follows the data: unchecked drafts, all checked, or no drafts left', () => {
  assert.strictEqual(Lore.footerNote([{ status: 'draft', sourcesChecked: false }, { status: 'draft', sourcesChecked: true }]), FOOT_A);
  assert.strictEqual(Lore.footerNote([{ status: 'draft', sourcesChecked: true }, { status: 'approved', sourcesChecked: true }]), FOOT_B);
  assert.strictEqual(Lore.footerNote([{ status: 'approved', sourcesChecked: true }]), '');
  assert.strictEqual(Lore.footerNote([]), '');
});

test('the page starts with the cautious footer text and the app updates it from the data', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'site', 'index.html'), 'utf8');
  assert.ok(html.includes('<p id="lorenote">' + FOOT_A + '</p>'));
  const app = fs.readFileSync(path.join(__dirname, '..', 'site', 'app.js'), 'utf8');
  assert.ok(app.includes('Lore.footerNote(lore)'));
});
