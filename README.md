# Eurth tools

> A friendly note: this is the hub of Eurth's advent calendar, and its doors open one a day from 10 to 24 December 2026. The schedule is in the open here because the code is public on trust. Please don't spoil the surprise before each door opens.

The front door for Eurth's free worldbuilding tools, at tools.eurth.org: every tool on one page, an advent calendar that reveals a new tool each day, a changelog for the whole suite, and a place to drop your nation's profile file and see what you have filled in. Made by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004.

Status: built, not yet live. The hub opens on 9 December 2026 at 00:00 Europe/Brussels. The [roadmap](roadmap.md) says what's next, what each release added and what's not planned.

## No cheating, no hints

The site is rebuilt once a day, and each build contains only the doors that are open, decided by the build server's clock and never the visitor's. A locked door is in the build as its number and its date and nothing else: no name, address or description in any page, script, data file, sitemap, picture or comment. A test (`tests/no-hints.test.ts`) builds the site for every day from 9 to 25 December and searches every file of all seventeen builds for anything about a door that is closed that day.

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
| The hub as this build may show it (the only thing pages read) | `src/hub/now.ts` |
| Pages: home, advent, changelog, about, 404 | `src/pages/` |
| The calendar, the live tools, the delights | `src/components/` |
| "Your nation", the one interactive part | `src/tool/Nation.svelte` |
| The site's name, address, title and pages | `eurth.config.mjs` |
| The sharing image and icons | `tools/make-images.mjs`, `public/` |
| Tests; example profiles to run them on | `tests/`, `tests/fixtures/profiles/` |

The list of tools itself (names, addresses, pitches, launch times, door numbers) is `tools.json` in [@eurth/style](https://github.com/eurth-org/eurth-style), shared by every tool's menu and footer.

## Adding a release to the changelog

Add an entry at the top of `src/data/changelog.json`: the tool's id, the day, a short title and a sentence or two. Entries can be written ahead: one shows only once its tool has launched and its day has come, and is held back while it mentions a tool whose door is still closed.

## Development

Node 22.23 or newer (CI runs on Node 26). The look, the shell and the rules come from [@eurth/style](https://github.com/eurth-org/eurth-style); its handbook is in `node_modules/@eurth/style/HANDBOOK.md`.

```sh
npm install
npm run dev       # the site, rebuilt as you edit
npm run check     # types
npm run build     # dist/
npm test          # needs the build; includes the seventeen no-hints builds (a minute or two)
npm run axe       # accessibility, every page, both themes
npm run preview   # the built site with its real headers (wrangler dev)
npm run images    # the sharing image and icons, with the Chrome on this machine
```

- To see the site as it will be on a given day, set the build's clock: `EURTH_BUILD_TIME=2026-12-13T09:00:00+01:00 npm run preview`. Nothing ever reads the visitor's clock.
- `NO_HINTS_DAYS=skip npm test` leaves the seventeen builds out while you work on something else. CI never does.
- Pages print only what `hubNow()` in `src/hub/now.ts` hands them. Don't import `tools.json`, the changelog file or the sections file into a page or a component, and never into anything that runs in the browser.
- Every word on the site is in `src/content/copy.ts`. Don't begin a sentence or a heading there with a word a door might hide; the tests check.

## Deployment

The hub is static files served by a Cloudflare Worker with no script (`wrangler.jsonc`), on tools.eurth.org. Until 9 December 2026 it is deployed nowhere.

- **Advent** (`.github/workflows/advent.yml`) runs at 22:30 UTC on 8 to 24 December: it builds the site as it will be at midnight in Brussels, checks and tests that build, waits for 00:00 and deploys. The run on the 8th puts the hub live.
- **Nightly** (`nightly.yml`) runs at 23:10 UTC every day: it updates @eurth/style within version 1, builds for the moment it runs, and deploys if the site differs from what is live.
- **CI** (`ci.yml`) checks every push; from 9 December, a green push to `main` is deployed.
- **By hand:** if Advent hasn't started by 22:45 UTC, start it from the Actions tab. If midnight has already passed, start Nightly instead.
- Deploying needs the organisation's `CLOUDFLARE_API_TOKEN` secret. Without it a run builds, warns and deploys nothing.

## Releasing

1. Move what's done out of "Next" in [roadmap.md](roadmap.md) and add a dated section for the release, newest first.
2. Add the release to `src/data/changelog.json` if visitors should read about it.
3. `npm run check && npm run build && npm test && npm run axe`, then push to `main`.

Made by Orioni for [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004. Apache 2.0.
