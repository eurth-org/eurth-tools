# Roadmap

The hub is the front door for Eurth's free worldbuilding tools, at tools.eurth.org: one page that lists every tool, an advent calendar that opens one new tool a day from 10 to 24 December 2026, a changelog for the whole suite, and a place to drop your nation's profile file and see what you have filled in. It goes live on 9 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**14 November 2026.** The brief is saved, the repository exists, and this plan is written. Phase 1 is next, from step 1.

Waiting on others:

- **@eurth/style 1.0.0** is not released. The package is being written (tokens, shell, `tools.json`, the build and testing helpers and a starter are on disk in the Foundations session, uncommitted), but there is no HANDBOOK.md, tag or release on GitHub yet. Phase 2 can't start until there is: check `gh release list -R eurth-org/eurth-style`. Until then no site, pages or styles.
- **@eurth/profile 1.0.0** is written and committed but not tagged. The hub needs little from it (see "Your nation" below).
- **Card** (door 15) decides how a profile reaches it. Until it says otherwise, "Open the card" is a plain link.
- **Stijn:** the redirect for worldbuilding.eurth.org (see Phase 3), and the answers to "Decisions to confirm" below.

## Decisions to confirm

Each has a default, and the build goes ahead on the default.

1. **Where the schedule lives.** The brief says the schedule is a data file in this repo; @eurth/style already holds it as `tools.json` (names, addresses, pitches, launch times, door numbers), and the header's Tools menu and every footer read it. Default: one source. The hub reads `tools.json` from @eurth/style at build time and keeps no copy, so the calendar, the menu and the footers can never disagree. Until 1.0.0 is out, the tests run against a snapshot in `tests/fixtures/`.
2. **When the nightly run happens.** The site for 9 December is built on the evening of the 8th, so the schedule is 22:30 UTC on 8 to 24 December: seventeen runs, for the sites of 9 to 25 December. The last one (for the 25th) takes the ring off door 15, turns the heading into "Advent 2026" and lets the footer link to GitHub.
3. **"Open the card".** Nothing may leave the device and nothing is stored, so the hub can't hand a file to another site. Default: once Card is live, the button is a link to it with a line saying to load the same file there. If Card defines a link that carries a small profile, the hub will use it.
4. **The profile library in the browser.** @eurth/profile's schema names every section ("dynasty", "passport", "anthem"), and most sections are named after tools whose doors are closed. Bundled into the hub's script it would be a list of hints. Default: the hub reads the file with a small reader of its own (size cap, JSON, `meta`, which top-level sections hold anything), and the build hands the page only the sections whose tools are live. Sections for closed doors are counted, never named: "and 3 more, for doors that haven't opened yet". Worth telling Foundations: every tool that bundles the library carries those names too, and the suite's spoiler test only looks for addresses.

## Next

### Phase 1: the logic, the data and the words (needs nothing from @eurth/style)

Plain TypeScript in `src/hub/`, tests in `tests/`, data in `src/data/`, words in `src/content/`. Only TypeScript and Vitest are installed. Commit and push after each step.

1. **Doors** (`doors.ts`): from the list of tools and the build's moment, the calendar as the page may show it.
   - A locked door is a number and a date and nothing else: `{ door: 5, state: 'locked', date: '14 Dec', label: 'Opens 14 Dec', aria: 'Door 5, opens 14 Dec' }`. The type has no field for a name, pitch or address, so a page can't print one by accident.
   - An open door adds the name, pitch, address and host. Today's door (opened on the build's Brussels calendar day) is marked `today`, for the ring and the words "Open today".
   - The season: before (all locked), during, and after (all open, no ring, the heading "Advent 2026").
   - Dates are Europe/Brussels days, whatever time zone the build server is in.
   - Checks on the schedule itself: fifteen doors, numbered 1 to 15, one a day from 10 to 24 December, each at 00:00 Brussels time.
2. **Live tools** (`live.ts`): "Already live": every launched tool and site except the hub, in `tools.json`'s order, so an advent tool joins the list the day its door opens.
3. **The clock** (`clock.ts`): the next midnight in Brussels from any moment, as an ISO time with its offset, and the nightly plan: within two hours before midnight, build for midnight and wait; at any other time (a late start, a run by hand, a push), build for now and deploy at once. Never waits longer than two hours.
4. **No hints** (`spoilers.ts`): the scanner the no-hints test runs over every built file. For each locked tool it looks for the address and host, the pitch, and the name as a whole word with its capital ("Dynasty", but not "the advent calendar"). It reports the file, the tool's door number and the place, never the name, so a failing CI log is not a spoiler either. A short, reviewed list of exceptions for words a library can't avoid.
5. **Changelog** (`changelog.ts`, `src/data/changelog.json`): every release of every live tool, newest first. An entry shows only if its tool has launched and its date has come; an entry that mentions a locked tool is held back until that door opens. Seeded from the roadmaps of Map, Newsroom, Governmint and Flagwright.
6. **Your nation** (`nation.ts`, `src/data/sections.json`): a reader for a dropped or picked profile file (2 MB cap, JSON, `meta.schema` 1, text clamped), and from it the list the page shows: each filled section whose tool is live, with its summary and a link to the tool, then a count of the rest. `sections.json` maps profile sections to tools; the build filters it, so the page only ever receives live ones.
7. **Small things** (`delight.ts`): the "yurt" key sequence (ignored while typing in a field), and whether the door should swing: once, the first time today's door is on screen in a visit, never for reduced motion. "Once a visit" rides in the tab like @eurth/style's switches (`window.name`), not in storage.
8. **Words** (`src/content/`): the home page's paragraph and section texts, the advent page, About (who makes the tools and why: free forever, no ads, no tracking), the 404, titles and descriptions for every page, the alt text of the sharing image, and the lines for `llms.txt`. British English, sentence case, and no tool's name with a capital before its door, which the tests check against the scanner.

### Phase 2: the site (once @eurth/style 1.0.0 is released)

Start from the starter template; the handbook decides everything shared. Develop and preview locally only: until 9 December the site doesn't exist anywhere.

1. **Scaffold** from the starter: Astro, static output, Svelte 5 for the two interactive parts, `eurth.config.mjs` (id `tools`, the pages All tools, Advent, Changelog, About), `LAUNCH_AT` 2026-12-09T00:00:00+01:00, `wrangler.jsonc` for tools.eurth.org with static assets only.
2. **Home** (`/`): "Free worldbuilding tools" and one paragraph; the calendar; "Already live"; "Your nation"; one Join Eurth call to action. All of it real HTML from the build, so it reads well with JavaScript off; "Your nation" then says it needs JavaScript and why.
3. **The calendar component:** a list of fifteen doors. Locked: number, date, a lock icon and "Opens 14 Dec". Open: number, date, "Open", name, pitch and address, as one link. Today: a ring and "Open today", never colour alone. Keyboard order follows the numbers; targets at least 44 by 44px.
4. **/advent/**: the calendar on its own, for sharing, with its own title, description and sharing image.
5. **/changelog/** and **/about/**.
6. **Your nation island** (Svelte): picker and drop, the list of sections, "Open the card" once Card is live. Only the live sections are passed in as props.
7. **Structured data:** Organization and WebSite everywhere, an ItemList of the live tools on the home page, BreadcrumbList on the other pages.
8. **Sharing image:** the yurt, "Free worldbuilding tools" and fifteen numbered doors, all closed, the same on every day. 1200 by 630 PNG with alt text.
9. **Signature touch and easter egg:** today's door swings open on its hinge, once a visit; typing "yurt" pitches a small yurt on the page with sparkles. Nothing for reduced motion; under half a second.
10. **Cache headers:** pages revalidate (a few minutes at most) so a new day shows promptly; hashed files stay cached for a year; the service worker fetches pages network-first, as the handbook has it.
11. **The no-hints test** (`tests/no-hints.test.ts`): build the site for every day from 9 to 25 December 2026 with `EURTH_BUILD_TIME` set to that day's midnight in Brussels, and run the scanner over every file of every build: HTML, scripts, JSON, the sitemap, `llms.txt`, the manifest, the service worker's file list, comments, island props, and the bytes of every image. Also: the 9 December build names no advent tool at all; each build's open doors are exactly the doors due; and the sharing image is byte-for-byte the same in all seventeen builds.
12. **Workflows:** CI on every push and pull request (check, build, test; Lighthouse and axe on main). The nightly rebuild, on a schedule at 22:30 UTC from 8 to 24 December and by hand: it asks `clock.ts` for the plan, builds for midnight, runs the tests against that build, waits, deploys. Pushes to main deploy only from 9 December. The nightly @eurth/style update through the shared workflow.
13. **The handbook's checklist:** contrast, headers, privacy, spoilers, pages, launch (the standard suites), axe on every page, Lighthouse 100 in all four categories, both themes, keyboard throughout.
14. **README** (use, development, deployment, the nightly run and how to run it by hand), `docs/feedback-log.md`, and this roadmap brought up to date.

### Phase 3: launch

- **worldbuilding.eurth.org.** A second custom domain on the Worker would serve a copy of the site, not a redirect, and a Worker script that redirects would use Worker requests. A Cloudflare Redirect Rule is free and uses none. Stijn to add: a proxied DNS record for `worldbuilding` (AAAA `100::`) and a Single Redirect from `worldbuilding.eurth.org/*` to `https://tools.eurth.org/` (301).
- **8 December, 22:30 UTC:** the first nightly run builds the site for the 9th and deploys it at midnight, which creates the custom domain. Check the `CLOUDFLARE_API_TOKEN` organisation secret before then; the run by hand is the fallback.
- **After launch:** submit the sitemap in Search Console, add the hub to status.eurth.org, announce on the forum and Discord.
- **Each morning, 10 to 24 December:** a look at the nightly run and the new door.

### Later

- "Advent 2026" stays on the page all year; the calendar code takes a year, so a 2027 calendar is a new schedule and nothing else.
- A feed (RSS) of the changelog.
- The changelog filled by each tool's own releases, read at build time, in place of a file kept by hand.

## Not planned

- **Hiding doors with the visitor's clock,** or with CSS, or with script. What a build doesn't contain can't be found in it.
- **A Worker script.** The hub is static files, so visits cost no Worker requests and it can't run up a bill.
- **Browser storage, cookies, analytics or accounts.** The profile file is read on the device and forgotten when the page closes.
- **Hints.** No silhouettes, blurred names, countdown teasers or "coming soon" lists. A locked door is a number and a date.
- **A private repository.** The code is public on trust; the site is what stays secret. Please don't spoil the doors.
- **Uploading or keeping profiles.** There is nowhere to send one.
