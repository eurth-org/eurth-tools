# Roadmap

The hub is the front door for Eurth's free worldbuilding tools, at tools.eurth.org: one page that lists every tool, an advent calendar that opens one new tool a day from 10 to 24 December 2026, a changelog for the whole suite, and a place to drop your nation's profile file and see what you have filled in. It goes live on 9 December 2026 at 00:00 Europe/Brussels.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**14 November 2026.** Phase 1 is done: the logic, the data and the words are written and tested (see "14 November 2026: groundwork" below). There is no site yet, on purpose.

**Next: Phase 2, step 1**, as soon as @eurth/style 1.0.0 is released. Check with `gh release list -R eurth-org/eurth-style`; late on 14 November HANDBOOK.md and the starter were on GitHub (and read: the notes below come from it), but there was no tag or release yet. When there is: read HANDBOOK.md first (it wins over the brief), copy the starter template, replace `package.json` and the configs with the starter's, keep `src/hub/`, `src/data/`, `src/content/` and `tests/`, delete `tests/fixtures/tools.json` and read the tools from `@eurth/style/build` instead (`everyTool()`, `buildTime()`).

Waiting on others:

- **@eurth/style 1.0.0** (Foundations). Things the hub needs from it or should raise with it:
  - The nightly run: the handbook gives the hub the shared `tool-nightly.yml` with `ahead: true` (build for the coming midnight, wait, deploy at 00:00), and says not to add steps of our own. So the hub's workflow is a thin caller on the brief's schedule (22:30 UTC, 8 to 24 December, and by hand), and `clock.ts` stays as the tested statement of what that run must do, and the source of the seventeen build times for the no-hints test. Check that the shared workflow runs `npm test` on the build it is about to deploy.
  - The profile buttons: the handbook has every tool use `ProfileButtons.svelte` from @eurth/profile. The hub only reads a file and saves nothing, and the library's schema would put the names of closed doors in the hub's script (decision 4). Either the hub keeps its own small reader, or @eurth/profile gains a way to read a file without the schema; the second would also fix it for every other tool.
  - Cache headers: the Astro integration always writes `_headers` itself. The hub needs a short `Cache-Control` on its pages; see whether the handbook has a way, or ask for one.
  - A flag that lasts for the visit: the door's swing should happen once a visit, and the visit's switches ride in `window.name` in a fixed shape with no room for more. Until there is a helper, the swing goes by how the page was reached (`delight.ts`).
  - Titles: the hub's start page can't follow "<Name>: free online <thing> maker for worldbuilders"; it leads with "Free worldbuilding tools". The other pages follow the handbook, "<Page> · Tools".
  - @eurth/profile's schema names every section in any tool's script that bundles it ("dynasty", "passport", "anthem"), and the suite's spoiler test only looks for addresses. Foundations should know.
- **@eurth/profile 1.0.0** is written and committed but not tagged. The hub doesn't install it (decision 4).
- **Card** (door 15) decides how a profile reaches it. Until it says otherwise, "Open the card" is a plain link.
- **Stijn:** the redirect for worldbuilding.eurth.org (see Phase 3), and the answers to "Decisions to confirm" below.

## Decisions to confirm

Each has a default, and the build goes ahead on the default.

1. **Where the schedule lives.** The brief says the schedule is a data file in this repo; @eurth/style already holds it as `tools.json` (names, addresses, pitches, launch times, door numbers), and the header's Tools menu and every footer read it. Default: one source. The hub reads `tools.json` from @eurth/style at build time and keeps no copy, so the calendar, the menu and the footers can never disagree. Until 1.0.0 is out, the tests run against a snapshot in `tests/fixtures/`.
2. **When the nightly run happens.** The site for 9 December is built on the evening of the 8th, so the schedule is 22:30 UTC on 8 to 24 December: seventeen runs, for the sites of 9 to 25 December. The last one (for the 25th) takes the ring off door 15, turns the heading into "Advent 2026" and lets the footer link to GitHub.
3. **"Open the card".** Nothing may leave the device and nothing is stored, so the hub can't hand a file to another site. Default: once Card is live, the button is a link to it with a line saying to load the same file there. If Card defines a link that carries a small profile, the hub will use it.
4. **The profile library in the browser.** @eurth/profile's schema names every section ("dynasty", "passport", "anthem"), and most sections are named after tools whose doors are closed. Bundled into the hub's script it would be a list of hints. Default: the hub reads the file with a small reader of its own (size cap, JSON, `meta`, which top-level sections hold anything), and the build hands the page only the sections whose tools are live. Sections for closed doors are counted, never named: "and 3 more, for doors that haven't opened yet". Worth telling Foundations: every tool that bundles the library carries those names too, and the suite's spoiler test only looks for addresses.

## Next

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
9. **Signature touch and easter egg:** today's door swings open on its hinge, once a visit; typing "yurt" pitches a small yurt on the page with sparkles. Nothing for reduced motion; under half a second. The decisions are in `delight.ts`; this step draws them.
10. **Cache headers:** pages revalidate (a few minutes at most) so a new day shows promptly; hashed files stay cached for a year; the service worker fetches pages network-first, as the handbook has it.
11. **The no-hints test** (`tests/no-hints.test.ts`; `tests/hub.test.ts` is its rehearsal on data): build the site for every day from 9 to 25 December 2026 with `EURTH_BUILD_TIME` set to that day's midnight in Brussels, and run the scanner over every file of every build: HTML, scripts, JSON, the sitemap, `llms.txt`, the manifest, the service worker's file list, comments, island props, and the bytes of every image. Also: the 9 December build names no advent tool at all; each build's open doors are exactly the doors due; and the sharing image is byte-for-byte the same in all seventeen builds.
12. **Workflows:** CI on every push and pull request (today: check and test; then check, build, test, with Lighthouse and axe on main). The nightly rebuild, on a schedule at 22:30 UTC from 8 to 24 December and by hand: it asks `clock.ts` for the plan, builds for midnight, runs the tests against that build, waits, deploys. Pushes to main deploy only from 9 December. The nightly @eurth/style update through the shared workflow.
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

## 14 November 2026: groundwork

Not a release: nothing is deployed, and there is no site. The logic, the data and the words, as plain TypeScript with 240 tests.

- **Doors** (`src/hub/doors.ts`): the calendar at the build's moment. A locked door is its number and date and nothing else; the type has no field for a name. Open doors, today's door, and the three seasons: before, during, and after ("Advent 2026").
- **Brussels time** (`brussels.ts`) and **the nightly clock** (`clock.ts`): days and midnights in Europe/Brussels on any machine; the plan for a run that starts now (build for midnight and wait, or build for now and deploy at once); the seventeen midnights from 9 to 25 December.
- **The no-hints scanner** (`spoilers.ts`): finds a locked tool's address, pitch or name in any text, through HTML entities, JSON escapes and URL encoding, and in file paths. Names match as whole words with their capital, because several doors hide everyday words. Findings never repeat the secret. A short list of reviewed exceptions is possible; none is needed yet.
- **Already live** (`live.ts`), **the changelog** (`changelog.ts`) and **Your nation** (`sections.ts` at build time, `nation.ts` in the browser), each giving the page only what is live.
- **Everything a build may show, in one call** (`index.ts`, `hubAt()`), and a rehearsal of the no-hints test on it for every day from 9 to 25 December.
- **The delights as decisions** (`delight.ts`): the "yurt" key sequence and when the door swings.
- **Data:** `src/data/changelog.json` with 24 releases of Map, Newsroom, Governmint and Flagwright, from their own roadmaps; `src/data/sections.json` mapping the profile's sixteen sections to their tools.
- **Words** (`src/content/copy.ts`): every heading, paragraph, label, title and description for the four pages, the 404 and `llms.txt`, checked by the scanner for every day.
- **CI:** type check and tests on every push.

Two changes from the mock-up, both for the no-hints rule: the home page's first paragraph no longer lists "coats of arms" (it is behind door 1), and "Your nation" counts sections for closed doors instead of naming them.

## Not planned

- **Hiding doors with the visitor's clock,** or with CSS, or with script. What a build doesn't contain can't be found in it.
- **A Worker script.** The hub is static files, so visits cost no Worker requests and it can't run up a bill.
- **Browser storage, cookies, analytics or accounts.** The profile file is read on the device and forgotten when the page closes.
- **Hints.** No silhouettes, blurred names, countdown teasers or "coming soon" lists. A locked door is a number and a date.
- **A private repository.** The code is public on trust; the site is what stays secret. Please don't spoil the doors.
- **Uploading or keeping profiles.** There is nowhere to send one.
