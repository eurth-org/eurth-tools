You're building the hub for Eurth's free worldbuilding tools, at tools.eurth.org, with an advent calendar that reveals one new tool a day. Eurth (eurth.org) is a worldbuilding and roleplay community since 2004. The attached repo is eurth-org/eurth-tools.

Working order (Foundations and many other tools are being built at the same time tonight):
1. Save this brief as CLAUDE.md.
2. If the repo named above doesn't exist on GitHub yet, create it as a public, empty repo in eurth-org with the gh CLI and connect this folder; if you can't, ask me.
3. Read what already exists of github.com/eurth-org/eurth-style (HANDBOOK.md) and github.com/eurth-org/eurth-profile; they may still be in progress. Write the plan and show it to me.
4. Build the tool's core logic as plain TypeScript modules with thorough tests, and its content and data (guide text, presets, examples, data snapshots). None of that needs eurth-style.
5. Only once @eurth/style 1.0.0 is released (check the releases of github.com/eurth-org/eurth-style), start the site from its starter template and carry on to the end of this brief. Until then, don't scaffold the site, pages or styles.
6. Commit and push after every finished step, and keep roadmap.md up to date with exactly where to pick up, so a new session can continue if this one stops.

Background for every step: Read HANDBOOK.md in github.com/eurth-org/eurth-style and start from its starter template; read the profile schema in github.com/eurth-org/eurth-profile; look at github.com/eurth-org/eurth-flag, the reference build. The handbook wins over this brief on everything shared: stack, look, shell, privacy, accessibility, SEO, sharing, offline, delight, writing, launch and deployment. Then write a plan and show it to me before you build.

Mock-up: the "tools.eurth.org, the hub and the advent calendar" board on https://claude.ai/artifact/32RKDdVTtCfHsL6Qc6LxV6.

What the hub is: the front door for the whole suite, ranking for "free worldbuilding tools". It goes live on 9 December, the day after my birthday, as my gift to the community.

Pages
- Home: the heading "Free worldbuilding tools" with one paragraph; the advent calendar; "Already live" with the tools in tools.json (today Map, Newsroom, Governmint and Flagwright; each advent tool joins it once its door opens); "Your nation"; one Join Eurth call to action.
- /advent: the calendar on its own, for sharing.
- /changelog: every release of every live tool, newest first, from a data file.
- /about: who makes the tools and why (free forever, no ads, no tracking), linking to eurth.org.

The advent calendar
- 15 doors, one a day from 10 to 24 December, each opening at 00:00 Europe/Brussels. Door 1 Arms, 2 Seats, 3 Names, 4 Cities, 5 Stats, 6 Dynasty, 7 Calendar, 8 Time, 9 Bank, 10 Passport, 11 Rank, 12 Anthem, 13 Prompts, 14 Wiki, 15 Card.
- A locked door shows only its number and date ("Opens 14 Dec"). An open door shows the tool's name, pitch and address and links to it; today's door is marked with a ring and the words "Open today".
- No cheating, no hints: the site is rebuilt once a day, and each build contains only the doors that are open, decided by the build server's clock, never the visitor's. A locked door is in the build only as its number and date: no names, addresses or descriptions in any HTML, script, JSON, sitemap, Open Graph image or comment.
- The schedule (dates, names, pitches, addresses) is a data file in the repo. The repo is public on trust, with the handbook's please-don't-spoil note; the site is what stays secret.
- The daily rebuild is a scheduled workflow from 9 to 24 December: it starts at 22:30 UTC, builds the next day's site, waits until 00:00 Brussels time and deploys. It also runs by hand as a fallback.
- The whole hub stays static assets, so visits cost no Worker requests on the Free plan. Set short cache headers so the new day shows promptly.
- Test it: build the site for every date from 9 to 25 December and check that nothing from a locked door appears in any file.
- After 24 December all doors stay open, and the calendar can be shown as "Advent 2026" all year.

Your nation
- Load a profile file (picker or drop). Show which sections are filled, each linking to its tool if that tool is live, and a button to open it in card.eurth.org once Card is live. Nothing leaves the device and nothing is stored.

Also
- worldbuilding.eurth.org should land here: ask me to add the redirect rule in Cloudflare, or do it with the Worker's routes if that stays free.
- Open Graph image: the yurt, "Free worldbuilding tools" and the calendar's 15 numbered doors, all closed.
- Signature touch: a door opening swings on its hinge, once, the first time today's door is shown in a visit. Easter egg: typing "yurt" anywhere sets up a little yurt on the page with sparkles.

Done when the handbook's checklist passes, the no-hints test passes for every day from 9 to 25 December, and the home page reads well with JavaScript off.
