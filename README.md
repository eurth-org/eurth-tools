# Eurth tools

> A friendly note: this is the hub of Eurth's advent calendar, and its doors open one a day from 10 to 24 December 2026. The schedule is in the open here because the code is public on trust. Please don't spoil the surprise before each door opens.

The front door for Eurth's free worldbuilding tools, at tools.eurth.org: every tool on one page, an advent calendar that reveals a new tool each day, a changelog for the whole suite, and a place to drop your nation's profile file and see what you have filled in. Made by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004.

Status: being built. Nothing is live yet; the hub opens on 9 December 2026. The [roadmap](roadmap.md) says what's next, what each release added and what's not planned.

## No cheating, no hints

The site is rebuilt once a day, and each build contains only the doors that are open, decided by the build server's clock and never the visitor's. A locked door is in the build as its number and its date and nothing else: no name, address or description in any page, script, data file, sitemap, picture or comment. A test checks exactly that for every day from 9 to 25 December: today on the data the pages will be made from, and once there is a site, on every file of all seventeen builds.

## Where things live

| What | Where |
| --- | --- |
| The calendar at a moment: locked doors, open doors, today's door | `src/hub/doors.ts` |
| Days and midnights in Europe/Brussels | `src/hub/brussels.ts` |
| The nightly run's plan: build for midnight and wait, or build for now | `src/hub/clock.ts` |
| The no-hints scanner | `src/hub/spoilers.ts` |
| "Already live" | `src/hub/live.ts` |
| The changelog, and its releases | `src/hub/changelog.ts`, `src/data/changelog.json` |
| "Your nation": which sections the page may know (build time), and reading a profile file (browser) | `src/hub/sections.ts`, `src/hub/nation.ts`, `src/data/sections.json` |
| Everything a build may show, in one call | `src/hub/index.ts` |
| The door's swing and the "yurt" easter egg, as decisions | `src/hub/delight.ts` |
| Every word on the site | `src/content/copy.ts` |
| Tests, and a snapshot of the suite's list of tools to run them on | `tests/`, `tests/fixtures/` |

The list of tools itself (names, addresses, pitches, launch times, door numbers) is `tools.json` in [@eurth/style](https://github.com/eurth-org/eurth-style), shared by every tool's menu and footer.

## Adding a release to the changelog

Add an entry at the top of `src/data/changelog.json`: the tool's id, the day, a short title and a sentence or two. Entries can be written ahead: one shows only once its tool has launched and its day has come, and is held back while it mentions a tool whose door is still closed.

## Development

Node 22 or newer.

```sh
npm install
npm run check   # types
npm test
```

Made by Orioni for Eurth. Apache 2.0.
