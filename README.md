# An Bhliain

The old Irish year as a living wheel: where today sits between Samhain, Imbolc, Bealtaine and Lughnasa, how much light there is in your town, a countdown to the next key day, and a daily lore card.

- `site/` the static page (no server, no tracking, nothing sent anywhere). Scripts: `solar.js` (sunrise and sunset), `irishtime.js` (Irish clock and date), `festivals.js` (key days and countdowns), `lore.js` (which card to show), `wheel.js` (date maths and drawing), `towns.js` (hand-made town list), `app.js` (the page).
- `data/lore.json` the lore cards. All are `"status": "draft"` and `"sourcesChecked": false` until the owner reviews them and the sources are checked.
- `test/` Node's built-in runner, offline: `node --test "test/*.test.js"`
- Preview: serve the repo folder and open `/site/`. Add `?date=2026-11-03` to pretend it is another day. The page reads `../data/lore.json`, so serve from the repo root (or copy `data/` next to `site/` when publishing).

Sunrise and sunset are calculated on the page. The solstice and equinox dates for 2026 to 2028 are a small table in `festivals.js` that must be extended and re-checked. Lore is written in my own words; each card is labelled Fact, Tradition or Saying.
