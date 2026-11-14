# Eurth tools

> A friendly note: this is the hub of Eurth's advent calendar, and its doors open one a day from 10 to 24 December 2026. The schedule is in the open here because the code is public on trust. Please don't spoil the surprise before each door opens.

The front door for Eurth's free worldbuilding tools, at tools.eurth.org: every tool on one page, an advent calendar that reveals a new tool each day, a changelog for the whole suite, and a place to drop your nation's profile file and see what you have filled in. Made by [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004.

Status: being built. Nothing is live yet; the hub opens on 9 December 2026. The [roadmap](roadmap.md) says what's next, what each release added and what's not planned.

## No cheating, no hints

The site is rebuilt once a day, and each build contains only the doors that are open, decided by the build server's clock and never the visitor's. A locked door is in the build as its number and its date and nothing else: no name, address or description in any page, script, data file, sitemap, picture or comment. A test builds the site for every day from 9 to 25 December and checks exactly that.

## Development

Node 22 or newer.

```sh
npm install
npm run check   # types
npm test
```

Made by Orioni for Eurth. Apache 2.0.
