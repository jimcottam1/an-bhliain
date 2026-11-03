# An Bhliain

The old Irish year as a living wheel: where today sits between Samhain, Imbolc, Bealtaine and Lughnasa, how much light there is, and a daily lore card.

- `site/` the static page (no server, no tracking, nothing sent anywhere)
- `data/lore.json` lore cards, all `"status": "draft"` until the owner reviews them
- `test/` Node's built-in runner: `node --test "test/*.test.js"`
- Preview: serve the repo folder and open `/site/` (add `?date=2026-11-03` to pick a date)

Sunrise and sunset are calculated on the page. Lore is written in my own words; each card is labelled Fact, Tradition or Saying.
