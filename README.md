# An Bhliain

The old Irish year as a living wheel: where today sits between Samhain, Imbolc, Bealtaine and Lughnasa, how much light there is in your town, a countdown to the next key day, and a daily lore card.

- `site/` the whole site, and the only folder to publish. Static, no server, no tracking, nothing sent anywhere. Scripts: `solar.js` (sunrise and sunset), `irishtime.js` (Irish clock and date), `festivals.js` (key days and countdowns), `lore.js` (which card to show), `wheel.js` (date maths and drawing), `towns.js` (hand-made town list), `share.js` (share text, link and delivery), `app.js` (the page). `site/og.png` and `site/og.svg` are the share picture. `site/data/lore.json` holds the lore cards.
- `scripts/` `make-og.js` draws `site/og.svg` from our own wheel geometry and writes `og-shapes.json`; `make-og.ps1` (Windows PowerShell, GDI+) draws the same picture as `site/og.png`. Run both to regenerate the picture.
- `test/` Node's built-in runner, offline: `node --test "test/*.test.js"`. Small saved fixtures are in `test/fixtures/`.
- Preview: serve the `site/` folder (for example `npx serve site`). Add `?date=2026-11-03` to open on another day. The date must exist and the year must be 1900 to 2100, otherwise it is ignored. "Today", the Today button and the share link always use the real Irish today, so a shared `?date=` link keeps its date.

## Sources and checks
- Sunrise and sunset: calculated on the page from the date and the town (standard sun-position formulae). The tests cross-check them against a second, independent algorithm.
- Solstices and equinoxes (2026 to 2035): U.S. Naval Observatory, Astronomical Applications Department, https://aa.usno.navy.mil/api/seasons?year=YYYY, fetched 3 Nov 2026 for 2026 to 2030 and 4 Nov 2026 for 2031 to 2035 (no robots.txt there, HTTP 404 on both dates; the service answers plain requests). Times are UTC and are converted to the Irish date; a test compares the table in `festivals.js` with the saved copy in `test/fixtures/usno-seasons.json`. This check found one mistake in my first table (the 2027 winter solstice is 22 December, not 21). Extend the table, the fixture and the test before 2036.
- Quarter days: the traditional fixed dates, 1 Nov, 1 Feb, 1 May, 1 Aug.
- Lore: written in my own words. A card stays `"status": "draft"` until the owner approves its wording. `"sourcesChecked"` says whether two independent sources have been checked for it. The page says so on each card: unchecked drafts read "We are still checking this card against its sources, so it may change."; checked drafts read "Sources checked; wording awaiting final review."; approved cards have no note. The footer line follows the data in the same way. Each card is labelled Fact, Tradition or Saying.
- Towns: about 27 hand-made coordinates, rounded to two decimals.

## Sharing
The Share button tries the phone's share sheet, then the clipboard, then shows a text box. It shares one line (date, days since the last quarter day, daylight in the chosen town) and the page link, with `?date=` when the chosen day is not today. It never shares lore text: `Share.loreShareable` allows a card only when it is approved and its sources are checked. The share picture's address in `index.html` (`og:image`) must be the real published address of `og.png`.

## Not done yet
Owner review of all lore wording; checking two sources per card; a real-phone and screen-reader test; a share card.
