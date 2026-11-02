# The blue-sky competition

Three competitor agents invent and build a website, show each other their work as they go, give and answer feedback, and a separate judge picks the best. The others then join the winner as developers. The owner watches it live and makes every real decision.

## The steer
"Something people in Ireland would enjoy or use." Anything within that: useful, playful or surprising.

## The players
| Agent | Angle | Model | Definition |
|---|---|---|---|
| **Ada** | Useful: something people would check every week | Sonnet | `.claude/agents/competitor.md` |
| **Pip** | Playful: a game or toy people would share | Sonnet | `.claude/agents/competitor.md` |
| **Wren** | Wildcard: surprising, something nobody has built | Sonnet | `.claude/agents/competitor.md` |
| **Judge** | Scores against the scorecard; read-only | Opus | `.claude/agents/judge.md` |
| Developers | The two runners-up, after the build round | Sonnet | `.claude/agents/developer.md` |
| Reviewer | Checks each change before merge | Opus | `.claude/agents/judge.md` (review mode) |

The main session (the orchestrator) starts each phase, relays nothing secret, verifies, merges and previews. It never pushes without the owner's "push".

## The board
`C:\Users\jim_c\competition-board\` is shared by everyone, outside all worktrees. Live view: `npx serve C:\Users\jim_c\competition-board -l 4091`, then open http://localhost:4091.

Each competitor writes only in its own folder, `agents/<name>/`:
- `diary.md`: a progress log, newest at the bottom, one entry per step: `## HH:MM · short title`, then two to five plain sentences on what you did, what you found, what you decided and what's next. Write after every meaningful step. Include dead ends and changes of plan; they're the interesting part for readers.
- `status.json`: `{ "name", "angle", "phase", "doing", "updated" }`, plus `"screenshot": "shot.png"` once there is one. Update it whenever `doing` changes.
- `pitch.md`: the pitch (see below).
- `feedback.md`: feedback you give, as sections headed `## To <Name> · <round>`, with **Keep**, **Steal**, **Improve** and **Drop** bullets, each specific and kind.
- `responses.md`: your answers to feedback you received, as sections headed `## From <Name> · <round>`, saying what you changed, or why not.
- `shot.png`: your latest screenshot (desktop), and `shot-phone.png` (390 px) once building.

The judge writes `judge/ranking.md` (pitches) and `judge/verdict.md` (builds). Everyone may read everything on the board at any time.

## Phases
1. **Pitch.** Each competitor writes two ideas in `pitch.md`. For each: the name, one sentence, who it's for, why they'd come back, the main screen sketched in words or ASCII, the data it needs with `robots.txt` and terms checked (URL and date), and the hardest part.
2. **Critique.** Each reads the other two pitches and writes feedback to both.
3. **Revise.** Each reads the feedback it received, answers it in `responses.md`, and revises `pitch.md`, marking its favourite idea. Borrowing is allowed; say where from.
4. **Rank.** The judge ranks all ideas in `judge/ranking.md`. **The owner picks** which idea each competitor builds (or vetoes any).
5. **Build**, each in its own worktree of this repo, with three checkpoints: *sketch*, *first working version*, *polish*. At each one, post screenshots, read the others' boards, write feedback, answer what you got, and adapt.
6. **Verdict.** The judge uses each site in the browser at desktop and 390 px and writes `judge/verdict.md`. **The owner confirms the winner.**
7. **Develop.** The runners-up join the winner as developers, from a backlog the judge writes (including the best ideas from the losing sites). Each change: developer, then review, then the orchestrator verifies, merges and previews, then the owner's "push".

## Scorecard (used by the judge)
| | Weight |
|---|---|
| **Delight:** does it make you smile, or say "that's clever"? | 20 |
| **Coming back:** is there a reason to return tomorrow or next week? | 20 |
| **Usefulness:** does it do its job well for real people in Ireland? | 15 |
| **Craft:** design, readability, speed, accessibility, phone experience | 20 |
| **Soundness:** tests, correct data, handles failure, no console errors | 10 |
| **Rules:** permitted sources, credits, no keys in the page, no tracking | 10 |
| **Use of feedback:** listened, adapted, and borrowed with credit | 5 |

A breach of a rule (an unpermitted source, a key in the page, a copied article or photo) disqualifies an entry until it's fixed.

## Rules for every agent
- Static site for GitHub Pages: no server, no running costs, no accounts, no tracking.
- Only public, permitted data: check `robots.txt` and the terms first, and credit the source. Don't get round blocks or pretend to be a browser. No API keys in the page or the repo.
- Don't copy articles, photos or other people's designs; republish only facts, short summaries in your own words, or data whose licence allows it.
- Tests use Node's built-in runner, offline, with small saved fixtures; prove a test bites by breaking the code on purpose.
- Check it in a browser at desktop width and in a 390 × 844 iframe, with no console errors. (Chrome blocks some ports, such as 5061; use 4100 to 4199.)
- Never push, merge, or create GitHub repos or issues. Never write in another competitor's folder or worktree.
- Plain British/Irish English. Words readers will see are drafts until the owner agrees them.
