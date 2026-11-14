/**
 * The hub's words: every heading, paragraph, label, title and description, in one place.
 *
 * British English, sentence case for headings, the staff voice: plain, warm, a dry joke allowed
 * (never in errors). No emoji.
 *
 * NO HINTS: nothing here may name a tool whose door could still be closed, and that includes a
 * capital at the start of a sentence. Several doors hide everyday words, so write "the advent
 * calendar" and "Brussels time", and never begin a sentence or a heading with one of them.
 * tests/copy.test.ts runs the no-hints scanner over all of this for every day of advent.
 * Anything that depends on a tool being live takes that tool as an argument from the build.
 */
import type { Calendar } from '../hub/doors.js';
import type { LiveTool } from '../hub/live.js';

/** The site's own facts, for eurth.config.mjs. */
export const SITE = {
  id: 'tools',
  name: 'Tools',
  url: 'https://tools.eurth.org',
  title: 'Free worldbuilding tools by Eurth: flags, governments, maps and more',
  description: 'Free worldbuilding tools from the Eurth community: a flag maker, a government builder, a world map and more. In your browser, with no account, no ads and nothing tracked.',
  tagline: 'Free worldbuilding tools',
  pages: [
    { href: '/', label: 'All tools' },
    { href: '/advent/', label: 'Advent' },
    { href: '/changelog/', label: 'Changelog' },
    { href: '/about/', label: 'About' },
  ],
  repo: 'https://github.com/eurth-org/eurth-tools',
  ogAlt: 'Free worldbuilding tools, at tools.eurth.org: the Eurth yurt beside an advent calendar of fifteen numbered doors, all of them closed.',
  /** The hub's own door: LAUNCH_AT. */
  launch: '2026-12-09T00:00:00+01:00',
} as const;

export const JOIN = { label: 'Join Eurth', href: 'https://eurth.org/signup' } as const;

/** The calendar's heading and the lines around it, which change with the season. */
export function calendarCopy(calendar: Calendar): { heading: string; strap: string; intro: string; status: string } {
  const { total, open, first, last, year } = calendar;
  if (calendar.season === 'after') {
    return {
      heading: `Advent ${year}`,
      strap: `${total} tools, one a day, ${first} to ${last} ${year}`,
      intro: `In December ${year} a door opened every day for ${total} days, each with a new tool behind it. They are all open now, and they stay open.`,
      status: `All ${total} doors are open.`,
    };
  }
  const strap = `${total} new tools, one a day, ${first.replace(/ \D+$/, '')} to ${last}`;
  if (calendar.season === 'before') {
    return {
      heading: 'The worldbuilding advent calendar',
      strap,
      intro: "Our gift to the community: a door opens every day at midnight, Brussels time. What's behind each one stays a surprise until then.",
      status: `The first door opens on ${first}.`,
    };
  }
  return {
    heading: 'The worldbuilding advent calendar',
    strap,
    intro:
      open === total
        ? 'Our gift to the community: a door opened every day at midnight, Brussels time. The last one opened today.'
        : "Our gift to the community: a door opens every day at midnight, Brussels time. What's behind the next one stays a surprise.",
    status: open === total ? `All ${total} doors are open.` : `${open} of ${total} doors ${open === 1 ? 'is' : 'are'} open.`,
  };
}

/** The home page. */
export function homeCopy(calendar: Calendar) {
  return {
    eyebrow: 'Eurth tools',
    heading: 'Free worldbuilding tools',
    intro: 'Flags, governments, maps and more, made by a worldbuilding community that has been at it since 2004. Free, in your browser, no account needed.',
    calendar: calendarCopy(calendar),
    live: {
      heading: 'Already live',
      badge: 'Live',
    },
    nation: NATION,
    join: {
      heading: 'Made something?',
      text: 'Share it with a community that builds whole worlds together.',
      button: JOIN,
    },
  };
}

/** "Your nation": the profile file, read on the device. */
export const NATION = {
  heading: 'Your nation',
  intro: 'Drop in your nation profile file to see which tools you have filled. Nothing leaves your device.',
  what: 'A nation profile is one small file, such as orioni.eurth.json, that you save from any of the tools and load in the next. It is how a nation travels between them without an account.',
  load: 'Load profile file',
  drop: 'Or drop the file anywhere on this page.',
  dropping: 'Let go to read the file.',
  noScript: 'Reading a profile needs JavaScript, because the file is read on your own device and never sent anywhere.',
  forget: 'Forget this file',
  forgotten: 'Forgotten. It was never anywhere but here.',
  filled: 'Filled',
  notYet: 'Not yet',
  copy: 'Copy description',
  copied: 'Description copied.',
  /** "Calderwyn: 3 of 3 sections filled" */
  result: (name: string, filled: number, total: number) => `${name || 'Your nation'}: ${filled} of ${total} ${total === 1 ? 'section' : 'sections'} filled`,
  /** "Open in Flagwright" */
  open: (tool: string) => `Open in ${tool}`,
  /** "Make one in Flagwright" */
  make: (tool: string) => `Make one in ${tool}`,
  /** "Welcome back, Calderwyn." */
  welcome: (name: string) => (name ? `Welcome back, ${name}.` : 'Profile read.'),
  /** Shown only once the tool that makes the card is live; the build passes it in. */
  card: (tool: Pick<LiveTool, 'name' | 'url'>) => ({
    button: 'Open the card',
    href: tool.url,
    note: `${tool.name} puts all of it on one page. Load the same file there: this page can't hand it over, because nothing leaves your device.`,
  }),
} as const;

/** The advent page: the calendar on its own, for sharing. */
export function adventCopy(calendar: Calendar) {
  const { total, first, last, year } = calendar;
  const after = calendar.season === 'after';
  return {
    title: after ? `Advent ${year}: ${total} free worldbuilding tools, one behind each door` : `The worldbuilding advent calendar: ${total} free tools in ${total} days`,
    description: after
      ? `The worldbuilding advent calendar of ${year}: ${total} free tools from the Eurth community, one behind each door, all open now. No account, no ads, nothing tracked.`
      : `A worldbuilding advent calendar from the Eurth community: ${total} free tools, a new one behind a door every day from ${first} to ${last} ${year}. No peeking.`,
    heading: after ? `Advent ${year}` : 'The worldbuilding advent calendar',
    calendar: calendarCopy(calendar),
    how: {
      heading: 'How it works',
      points: after
        ? [
            `A door opened every day at midnight, Brussels time, from ${first} to ${last} ${year}.`,
            'Every tool behind a door is free and stays free: no ads, no accounts, nothing tracked.',
            'Nothing was hidden in the page. Each night the site was rebuilt with one more door in it.',
          ]
        : [
            `A door opens every day at 00:00, Brussels time, from ${first} to ${last}.`,
            'Every tool behind a door is free and stays free: no ads, no accounts, nothing tracked.',
            "No peeking: a locked door isn't hidden in the page, it isn't in the page at all. Each night the site is rebuilt with one more door in it. Do look at the source; we did.",
          ],
    },
    back: { label: 'All tools', href: '/' },
    ogAlt: after
      ? `Advent ${year} at tools.eurth.org: the Eurth yurt beside a calendar of ${total} numbered doors.`
      : `The worldbuilding advent calendar at tools.eurth.org: the Eurth yurt beside ${total} numbered doors, all of them closed.`,
  };
}

/** The changelog page. */
export const CHANGELOG = {
  title: "Changelog: every release of Eurth's worldbuilding tools",
  description: "What's new in Eurth's free worldbuilding tools: every release of every live tool, newest first, from the first map to this week's fixes.",
  heading: 'Changelog',
  intro: 'Every release of every live tool, newest first.',
  empty: 'Nothing has been released yet. That will change.',
  /** "Version 0.1.0" */
  version: (version: string) => `Version ${version}`,
} as const;

export interface AboutSection {
  heading: string;
  /** Paragraphs; links are written as [words](address). */
  paragraphs: string[];
}

/**
 * The about page: who makes the tools and why.
 * @param github whether pages may link to GitHub yet (from 25 December 2026)
 */
export function aboutCopy({ github }: { github: boolean }): { title: string; description: string; heading: string; intro: string; sections: AboutSection[] } {
  return {
    title: "About Eurth's free worldbuilding tools: who makes them and why",
    description: "Who makes Eurth's worldbuilding tools and why they are free forever: no ads, no analytics, no trackers, no cookies and no accounts. Made for fiction and fun.",
    heading: 'About the tools',
    intro: 'Small, sharp tools for people who build worlds, made by people who have been building one together since 2004.',
    sections: [
      {
        heading: 'Who makes them',
        paragraphs: [
          'The tools are made by Orioni for [Eurth](https://eurth.org), a worldbuilding and roleplay community since 2004, with a shared map and a newsroom of its own.',
          'They are made for the nations of that community, and they are open to everyone, whether or not you ever set foot on Eurth.',
        ],
      },
      {
        heading: 'Free forever',
        paragraphs: [
          'No ads, no analytics, no trackers, no cookies and no accounts. Nothing you make is stored on a server, because there is no server to store it on: every tool is a set of files that runs in your browser.',
          'What you make lives in its link, which holds the whole design, and in your nation profile: one small file on your own device that you carry from tool to tool. Saving never means our storage, or your browser’s.',
          'There is nothing to buy and nobody to pay. The tools are a gift, made for fiction and fun.',
        ],
      },
      {
        heading: 'How they are made',
        paragraphs: [
          'Each tool is its own small website, and the newer ones keep working without signal once you have visited them. They share one look and one set of rules: readable by everyone, usable by keyboard, and never relying on colour alone.',
          github
            ? 'The code is open under the Apache 2.0 licence, on [GitHub](https://github.com/eurth-org). Suggestions are welcome there and on the Eurth forum.'
            : 'The code is open under the Apache 2.0 licence. Suggestions are welcome on the Eurth forum.',
        ],
      },
      {
        heading: 'Come and build',
        paragraphs: ['If you have made a flag, a government or a whole nation and want somewhere to put it, [Eurth](https://eurth.org) has room on the map.'],
      },
    ],
  };
}

/** The page that isn't there. */
export const NOT_FOUND = {
  title: 'Page not found',
  heading: 'This door leads nowhere',
  text: "The page you were after isn't here. The tools are.",
  back: { label: 'All tools', href: '/' },
} as const;

/** Small things said in passing. */
export const TOASTS = {
  yurt: 'Home is where the yurt is.',
  doorToday: 'A new door, fresh off its hinges.',
} as const;

/** Extra lines for llms.txt, as Markdown: what the hub is, and the tools that are live. */
export function llmsLines(live: readonly LiveTool[], calendar: Calendar): string {
  const lines = [
    'The hub lists every free worldbuilding tool made by Eurth, a worldbuilding and roleplay community since 2004. Every tool runs in the browser, with no account, no ads and nothing tracked.',
    '',
    '## Tools',
    ...live.map((tool) => `- [${tool.name}](${tool.url}/): ${tool.pitch}`),
    '',
    '## Pages',
    `- [${calendarCopy(calendar).heading}](${SITE.url}/advent/): ${calendarCopy(calendar).strap}`,
    `- [Changelog](${SITE.url}/changelog/): every release of every live tool`,
    `- [About](${SITE.url}/about/): who makes the tools and why they are free`,
  ];
  return lines.join('\n');
}

export interface Segment {
  text: string;
  href?: string;
}

/** A paragraph split at its [words](address) links, for a page to render as text and anchors. */
export function segments(paragraph: string): Segment[] {
  const found: Segment[] = [];
  let last = 0;
  for (const match of paragraph.matchAll(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g)) {
    if (match.index > last) found.push({ text: paragraph.slice(last, match.index) });
    found.push({ text: match[1] ?? '', href: match[2] ?? '' });
    last = match.index + match[0].length;
  }
  if (last < paragraph.length) found.push({ text: paragraph.slice(last) });
  return found;
}
