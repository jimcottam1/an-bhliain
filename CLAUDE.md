# An Bhliain: notes for agents

The old Irish year as a living wheel: where today sits between Samhain, Imbolc, Bealtaine and Lughnasa, daylight in your town, a countdown to the next key day, and a daily lore card. A static site for GitHub Pages; everything is worked out in the browser, with no outside data at run time. Built in the blue-sky competition (second, 78/100); see README.md for the layout and sources.

## Commands
- `node --test "test/*.test.js"`: offline tests. Must pass before any commit.
- Preview: `npx serve site -l <port>` (use 4100 to 4199; Chrome blocks 5061). Add `?date=YYYY-MM-DD` to pretend it is another day.

## Team
Lead: **Wren**. Shared specialists: **Sage** (sources and fact-checking), **Iris** (design and accessibility), **Rowan** (testing). Reviewer: **the Judge** (Opus). Agent definitions are in `.claude/agents/`. Everyone keeps a progress log in `C:\Users\jim_c\competition-board\agents\<name>\diary.md`.

## How we work
- **Test first**, offline; break the code on purpose to prove each key test bites, and log which breakages were caught.
- Each change in its own worktree branch; the Judge reviews it; the orchestrator verifies, merges and previews; **nothing is pushed without the owner's "push"**.
- Check anything visible at desktop width and in a 390 × 844 iframe, with no console errors, in one browser tab you created yourself; close it and stop your server when done. The PC is short of memory: never run more than one server.
- Words readers see are drafts until the owner agrees them.

## Lore rules (`site/data/lore.json`)
- Every card is labelled **Fact**, **Tradition** or **Saying**, written in our own words, never copied from a book, site or archive (including the Schools' Collection on Dúchas).
- A card may lose `"status": "draft"` only when **two independent, citable sources** support it (recorded with title, author or publisher, and URL or page, and the date checked), `"sourcesChecked": true` is set, **and the owner has approved its wording**.
- If a claim can't be supported, reword it to what the sources do say, mark it as a local or disputed tradition, or drop it. Never invent a source.

## Rules
- Only permitted sources (check `robots.txt` and terms); honest User-Agent; never get round blocks.
- No keys, accounts, tracking or third-party scripts; nothing sent anywhere.
- Escape everything shown on the page; only http(s) links.
