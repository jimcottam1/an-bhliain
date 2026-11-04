// Draws the share picture (site/og.svg) from our own wheel geometry, and writes
// scripts/og-shapes.json so scripts/make-og.ps1 can draw the same picture as site/og.png.
// Run: node scripts/make-og.js   then   powershell -File scripts/make-og.ps1
const fs = require('fs'), path = require('path');
const Wheel = require('../site/wheel.js');

const W = 1200, H = 630, CX = 330, CY = 315, R_OUT = 250, R_IN = 150;
const COLOURS = { winter: '#3b5f86', spring: '#5f9a6b', summer: '#d9a43a', autumn: '#b4583a' };
const BG = '#0f1a24', INK = '#f1ead9', GOLD = '#f2b84b', MUTED = '#9aa8b1';

const startYear = 2026; // any year: the angles differ by less than a degree
const angles = Wheel.SEASONS.map((q) => Wheel.angleFor(q.month >= 11 ? startYear : startYear + 1, q.month, q.day));
angles.push(360);

const pt = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
const f = (n) => n.toFixed(1);
function arc(a0, a1) {
  const p0 = pt(R_OUT, a0), p1 = pt(R_OUT, a1), p2 = pt(R_IN, a1), p3 = pt(R_IN, a0), big = a1 - a0 > 180 ? 1 : 0;
  return `M${f(p0[0])} ${f(p0[1])} A${R_OUT} ${R_OUT} 0 ${big} 1 ${f(p1[0])} ${f(p1[1])} L${f(p2[0])} ${f(p2[1])} A${R_IN} ${R_IN} 0 ${big} 0 ${f(p3[0])} ${f(p3[1])} Z`;
}

const wedges = Wheel.SEASONS.map((q, i) => {
  const a0 = angles[i] + 0.8, a1 = angles[i + 1] - 0.8, mid = (angles[i] + angles[i + 1]) / 2, lp = pt((R_OUT + R_IN) / 2, mid);
  return { irish: q.irish, english: q.english, quarter: q.quarter, colour: COLOURS[q.english], a0, a1, labelX: lp[0], labelY: lp[1], d: arc(a0, a1) };
});
const dot = pt((R_OUT + R_IN) / 2, 0);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="The wheel of the old Irish year, with Samhain at the top">
<rect width="${W}" height="${H}" fill="${BG}"/>
<circle cx="${CX}" cy="${CY}" r="${R_OUT + 24}" fill="none" stroke="#2b3d4a" stroke-width="2"/>
${wedges.map((w) => `<path d="${w.d}" fill="${w.colour}"/>`).join('\n')}
${wedges.map((w) => `<text x="${f(w.labelX)}" y="${f(w.labelY)}" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="700" fill="#ffffff">${w.irish}</text>
<text x="${f(w.labelX)}" y="${f(w.labelY + 28)}" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-style="italic" fill="#ffffff">${w.english}</text>`).join('\n')}
<circle cx="${f(dot[0])}" cy="${f(dot[1])}" r="22" fill="${GOLD}" opacity="0.35"/>
<circle cx="${f(dot[0])}" cy="${f(dot[1])}" r="13" fill="${GOLD}" stroke="${BG}" stroke-width="4"/>
<text x="${CX}" y="${CY + 14}" text-anchor="middle" font-family="Georgia, serif" font-size="46" font-weight="700" fill="${INK}">Samhain</text>
<text x="${CX}" y="${CY + 52}" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-style="italic" fill="${GOLD}">the year begins</text>
<text x="660" y="250" font-family="Georgia, serif" font-size="86" font-weight="700" fill="${INK}">An Bhliain</text>
<text x="664" y="312" font-family="Georgia, serif" font-size="40" font-style="italic" fill="${GOLD}">The old Irish year</text>
<text x="664" y="400" font-family="Georgia, serif" font-size="27" fill="${MUTED}">Samhain · Imbolc · Bealtaine · Lughnasa</text>
<text x="664" y="446" font-family="Georgia, serif" font-size="27" fill="${MUTED}">Where are we today, and how much light?</text>
</svg>
`;
fs.writeFileSync(path.join(__dirname, '..', 'site', 'og.svg'), svg);
fs.writeFileSync(path.join(__dirname, 'og-shapes.json'), JSON.stringify({ W, H, CX, CY, R_OUT, R_IN, BG, INK, GOLD, MUTED, wedges: wedges.map(({ irish, english, colour, a0, a1, labelX, labelY }) => ({ irish, english, colour, a0, a1, labelX, labelY })), dot }, null, 1));
console.log('wrote site/og.svg and scripts/og-shapes.json');
