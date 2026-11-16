# Roadmap

The hub is the front door for Eurth's free worldbuilding tools, at tools.eurth.org: one page that lists every tool, an advent calendar that opens one new tool a day from 10 to 24 December 2026, a changelog for the whole suite, and a place to drop your nation's profile file and see what you have filled in. It has been live since 15 November 2026.

Three parts: what comes next, what each release added (newest first), and what's not planned.

## Where to pick up

**15 November 2026. The hub is live at tools.eurth.org,** with fifteen locked doors, the four live tools, "Your nation" and the other pages. Stijn opened it three weeks ahead of the planned 9 December: first by hand (`npx wrangler deploy` from a build made, tested and searched that day), then by moving the hub's launch to 15 November in @eurth/style's `tools.json` (release 1.2.1) and in `LAUNCH_AT` here.

- **The workflows deploy now.** A green push to `main` is deployed, and Nightly (23:10 UTC) rebuilds and deploys when the site has changed. Advent takes over the midnights from 8 December.
- **Who links to the hub.** Every site on the shared shell shows "All tools" in its header and footer from its next build: style.eurth.org does already. Flagwright and Governmint still carry their own header and footer on `main` (each has a `shared-shell` branch waiting for Stijn), so they link to the hub once that is merged.
- **The handbook's rule** that a site doesn't exist before its door still holds for every tool behind a door, and the hub's builds still hold nothing about them.

**Next: Phase 3** (below): the status page and the announcement, and then the calendar itself from 9 December.

- **Seen by eye, in headless Chrome** (15 November): the home page in both themes and at phone width, the advent, changelog and about pages, and the door caught mid-swing, all from a build for 13 December. Still worth a look by a person on a real phone, now on the live site.
- **The `CLOUDFLARE_API_TOKEN` organisation secret** is set for eurth-org (Stijn, 15 November 2026).
- **Done on 16 November:** worldbuilding.eurth.org redirects to the hub, and the sitemap is in Search Console (domain property eurth.org; read with "Success"). Open: the status page ([eurth-org/eurth-status#10](https://github.com/eurth-org/eurth-status/pull/10) adds the hub as `TLS006` and waits to be merged) and the Patreon post; the forum and Discord announcements are scheduled for 9 December (Phase 3).

Raised with Foundations (@eurth/style and @eurth/profile), none of them blocking:

- **The profile library names closed doors.** @eurth/profile's schema names every section ("dynasty", "passport", "anthem") in the script of any tool that bundles it, and the suite's spoiler test only looks for addresses. The hub doesn't install the library for that reason (decision 4) and reads the file with its own small reader, so it also doesn't use `ProfileButtons.svelte` as the handbook asks. A way to read a file without the schema would fix it for every tool.
- **A run by hand after midnight.** The shared nightly workflow with `ahead: true` always builds for the next midnight, so started by hand after 00:00 it refuses (more than two hours early). The hub therefore keeps two thin callers: Advent (`ahead: true`, 22:30 UTC) and Nightly (23:10 UTC, builds for the moment it runs), and Nightly is the fallback.
- **A flag that lasts for the visit.** The door should swing once a visit; the visit's switches ride in `window.name` in a fixed shape with no room for more. Until there is a helper, the swing goes by how the page was reached (`delight.ts`).
- **The start page's title** can't follow "<Name>: free online <thing> maker for worldbuilders"; it leads with "Free worldbuilding tools". The other pages follow the handbook: "<Page> · Tools".
- **Card** (door 15) decides how a profile reaches it. Until it says otherwise, "Open the card" is a plain link.

## Decisions

Confirmed by Stijn on 14 November 2026.

1. **Where the schedule lives.** The brief says the schedule is a data file in this repo; @eurth/style already holds it as `tools.json` (names, addresses, pitches, launch times, door numbers), and the header's Tools menu and every footer read it. One source: the hub reads `tools.json` from @eurth/style at build time and keeps no copy, so the calendar, the menu and the footers can never disagree. The tests read the same file.
2. **When the nightly run happens.** The site for 9 December is built on the evening of the 8th, so the schedule is 22:30 UTC on 8 to 24 December: seventeen runs, for the sites of 9 to 25 December. The last one (for the 25th) takes the ring off door 15, turns the heading into "Advent 2026" and lets the footer link to GitHub.
3. **"Open the card".** Nothing may leave the device and nothing is stored, so the hub can't hand a file to another site. Once Card is live, the button is a link to it with a line saying to load the same file there. If Card defines a link that carries a small profile, the hub will use it.
4. **The profile library in the browser.** @eurth/profile's schema names every section ("dynasty", "passport", "anthem"), and most sections are named after tools whose doors are closed. Bundled into the hub's script it would be a list of hints. So the hub reads the file with a small reader of its own (size cap, JSON, `meta`, which top-level sections hold anything), and the build hands the page only the sections whose tools are live. Sections for closed doors are counted, never named: "and 3 more, for doors that haven't opened yet". Worth telling Foundations: every tool that bundles the library carries those names too, and the suite's spoiler test only looks for addresses.

## Next

### Phase 3: launch

- **The status page:** merge [eurth-org/eurth-status#10](https://github.com/eurth-org/eurth-status/pull/10), which deploys it, and look at status.eurth.org afterwards.
- **The announcement goes out on Wednesday 9 December at 18:00 Brussels time,** the evening before door 1. No door is named in it.
  - **Forum:** scheduled. Topic 18311 waits in the admin-only Administration category with a timer that publishes it to OOC Planning & Discussion (tag `tool`) at that moment. To change the words, edit the topic; to change the time, the topic's timer.
  - **Discord:** a one-off scheduled task in the Claude desktop app on Stijn's Mac (`eurth-tools-discord-announcement`) posts one message in #wurldbuilding through Chrome. The Mac must be awake, with the app and Chrome open and Discord signed in; if it runs late it posts nothing and says so.
  - **Patreon:** not scheduled. Claude's browsers refuse patreon.com, so Stijn schedules that post himself (public, same time).
- **9 December, 22:30 UTC:** the Advent run that opens door 1 at midnight (the run on the 8th changes nothing). On any evening from then to the 24th: if it hasn't started by 22:45 UTC, start Advent by hand; if midnight has passed, start Nightly by hand.
- **Each morning, 10 to 25 December:** a look at the Advent run and the new door.
- **After 25 December:** delete `.github/workflows/advent.yml`; Nightly carries on alone.

### Later

- "Advent 2026" stays on the page all year; the calendar code takes a year, so a 2027 calendar is a new schedule and nothing else.
- A feed (RSS) of the changelog.
- The changelog filled by each tool's own releases, read at build time, in place of a file kept by hand.

## 16 November 2026: a second address

- **worldbuilding.eurth.org** redirects to the hub, path for path, with a 301. It is a second Worker of static assets only (`redirect/`): one `_redirects` rule and no script, so it costs no Worker requests and needs no rule in the Cloudflare dashboard. Deployed by hand; it never changes.
- **Search Console:** the hub's sitemap is submitted under the eurth.org domain property.

## 15 November 2026: the site (0.1.0), live the same day

Built from the @eurth/style 1.0.0 starter and live at tools.eurth.org since 15 November 2026, three weeks ahead of the 9 December first planned (see "Where to pick up"). The hub's launch date moved with it, in @eurth/style 1.2.1 and in `LAUNCH_AT`.

- **Home:** "Free worldbuilding tools" and one paragraph; the advent calendar; "Already live"; "Your nation"; one Join Eurth call to action. Real HTML from the build, so it reads with JavaScript off; only reading a profile file needs script, and says so.
- **The calendar:** fifteen doors in a list, five across (three on a tablet, two on a phone). Locked: its number, a lock and "Opens 14 Dec". Open: its number and date, "Open", and the tool's name, pitch and address as one link. Today's door: a ring and the words "Open today". After the 24th the heading becomes "Advent 2026".
- **/advent/** (the calendar on its own, with how it works), **/changelog/** (24 releases of the four live tools, newest first), **/about/** (who makes the tools and why they are free) and a 404 page.
- **Your nation:** pick or drop a profile file; the page lists each section whose tool is live as filled or not yet, with its summary and a link to its tool, and counts the rest without naming them. "Copy description" and "Forget this file". Read on the device, never stored. "Open the card" appears once that door has opened.
- **The no-hints test** (`tests/no-hints.test.ts`): builds the site for every day from 9 to 25 December 2026 and searches every file of all seventeen builds, pictures and paths included, for the name, address or pitch of any tool whose door is closed that day. Also: exactly the doors that are due are open; the sharing image is the same picture on every day; no page links to GitHub before the 25th. The build in `dist/` is searched the same way before every deploy. No exceptions were needed. The scanner also sees through invisible breaks (`<wbr>`, soft hyphens, zero-width spaces), so a name can't hide by being split.
- **Workflows,** all thin callers of @eurth/style's: CI; Advent (22:30 UTC on 8 to 24 December: build for the coming midnight, test, wait, deploy at 00:00 Brussels time); Nightly (23:10 UTC: the safety net, and how a new @eurth/style release arrives).
- **Signature touch and easter egg:** today's door swings open on its hinge, once, the first time it is on screen in a visit; typing "yurt" anywhere pitches a little yurt with sparkles and a toast. Nothing moves for reduced motion.
- **Sharing image:** the yurt, "Free worldbuilding tools" and fifteen numbered doors, all closed. Drawn from numbers alone, so it can't give a door away.
- **Static files only:** no Worker script, so a visit costs no Worker requests. Pages are served with Cloudflare's default for static assets (`max-age=0, must-revalidate`), so a new day's build shows on the next visit; hashed files are cached for a year; the service worker fetches pages from the network first.
- **Structured data:** Organization and WebSite on every page, an ItemList of the live tools on the home page, breadcrumbs on the others.
- **One source for the schedule:** the tests and the site read `tools.json` from @eurth/style; the snapshot in `tests/fixtures/` is gone.

## 14 November 2026: groundwork

Not a release: nothing was deployed, and there was no site yet. The logic, the data and the words, as plain TypeScript with 240 tests.

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
