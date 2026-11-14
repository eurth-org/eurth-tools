import { describe, expect, it } from 'vitest';
import { aboutCopy, adventCopy, calendarCopy, CHANGELOG, homeCopy, JOIN, llmsLines, NATION, NOT_FOUND, segments, SITE, TOASTS } from '../src/content/copy.js';
import { calendarAt } from '../src/hub/doors.js';
import { liveTool, liveTools } from '../src/hub/live.js';
import { describeFinding, findSpoilers, secretsAt } from '../src/hub/spoilers.js';
import { findTool } from './helpers.js';
import { at, TOOLS } from './helpers.js';

/** Every word the site can say on a given day, functions called with what the build would pass. */
function everyWord(moment: Date): string {
  const calendar = calendarAt(TOOLS, moment);
  const live = liveTools(TOOLS, moment);
  const card = liveTool(TOOLS, moment, 'card');
  const said: unknown[] = [
    SITE,
    JOIN,
    homeCopy(calendar),
    adventCopy(calendar),
    CHANGELOG,
    CHANGELOG.version('1.0.0'),
    aboutCopy({ github: false }),
    aboutCopy({ github: true }),
    NOT_FOUND,
    TOASTS,
    llmsLines(live, calendar),
    NATION.result('Calderwyn', 3, 3),
    NATION.result('', 0, 1),
    NATION.welcome('Calderwyn'),
    NATION.welcome(''),
    ...live.flatMap((tool) => [NATION.open(tool.name), NATION.make(tool.name)]),
    card ? NATION.card(card) : null,
  ];
  return JSON.stringify(said);
}

const DAYS = Array.from({ length: 17 }, (_, i) => i + 9);

describe('the words', () => {
  it.each(DAYS)('on %i December name no tool whose door is closed', (day) => {
    const moment = at(day);
    expect(findSpoilers(everyWord(moment), secretsAt(TOOLS, moment), { kinds: ['address', 'pitch', 'name'] }).map(describeFinding)).toEqual([]);
  });

  it('have no emoji and no American spellings', () => {
    for (const day of [9, 13, 25]) {
      const words = everyWord(at(day));
      expect(words).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(words).not.toMatch(/\b(color|colors|center|favorite|organize|organization|license|catalog|gray|traveling|program)\b/i);
    }
  });

  it('put no full stop on a heading or a button', () => {
    const calendar = calendarAt(TOOLS, at(13));
    const home = homeCopy(calendar);
    const about = aboutCopy({ github: false });
    const headings = [home.heading, home.calendar.heading, home.live.heading, home.nation.heading, home.join.heading, adventCopy(calendar).heading, CHANGELOG.heading, about.heading, ...about.sections.map((s) => s.heading), NOT_FOUND.heading, NATION.load, NATION.forget, JOIN.label];
    for (const heading of headings) {
      expect(heading, heading).not.toMatch(/[.!]$/);
      // Sentence case: one capital to start, then none except names.
      expect(heading.replace(/Eurth|Advent \d{4}|\bI\b/g, '').slice(1), heading).not.toMatch(/[A-Z]/);
    }
  });
});

describe('the site', () => {
  it('is the hub of tools.json', () => {
    const hub = findTool('tools');
    expect(hub?.kind).toBe('hub');
    expect(SITE.url).toBe(hub?.url);
    expect(new Date(SITE.launch).getTime()).toBe(new Date(hub?.launch ?? '').getTime());
    expect(SITE.tagline).toBe(hub?.pitch);
    expect(SITE.pages.map((page) => page.href)).toEqual(['/', '/advent/', '/changelog/', '/about/']);
  });

  it('opens with the heading the brief asks for', () => {
    expect(homeCopy(calendarAt(TOOLS, at(9))).heading).toBe('Free worldbuilding tools');
    expect(SITE.title.startsWith('Free worldbuilding tools')).toBe(true);
  });

  it.each([9, 13, 25])('on %i December has a title and a description of its own for every page', (day) => {
    const calendar = calendarAt(TOOLS, at(day));
    const pages = [
      { title: SITE.title, description: SITE.description },
      adventCopy(calendar),
      CHANGELOG,
      aboutCopy({ github: day >= 25 }),
    ];
    for (const page of pages) {
      expect(page.title.length, page.title).toBeGreaterThan(10);
      // Every page but the start page is titled "<Page> · Tools" by the shell.
      expect(page.title.length + ` · ${SITE.name}`.length, page.title).toBeLessThanOrEqual(70);
      expect(page.description.length, `${page.title}: ${page.description.length} characters`).toBeGreaterThanOrEqual(50);
      expect(page.description.length, `${page.title}: ${page.description.length} characters`).toBeLessThanOrEqual(200);
    }
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.description)).size).toBe(pages.length);
  });
});

describe('the calendar\'s words', () => {
  it('before the first door', () => {
    expect(calendarCopy(calendarAt(TOOLS, at(9)))).toEqual({
      heading: 'The worldbuilding advent calendar',
      strap: '15 new tools, one a day, 10 to 24 December',
      intro: "Our gift to the community: a door opens every day at midnight, Brussels time. What's behind each one stays a surprise until then.",
      status: 'The first door opens on 10 December.',
    });
  });

  it('during advent count the open doors', () => {
    expect(calendarCopy(calendarAt(TOOLS, at(10))).status).toBe('1 of 15 doors is open.');
    expect(calendarCopy(calendarAt(TOOLS, at(13))).status).toBe('4 of 15 doors are open.');
    expect(calendarCopy(calendarAt(TOOLS, at(13))).intro).toMatch(/What's behind the next one stays a surprise\.$/);
    expect(calendarCopy(calendarAt(TOOLS, at(24))).status).toBe('All 15 doors are open.');
    expect(calendarCopy(calendarAt(TOOLS, at(24))).intro).toMatch(/The last one opened today\.$/);
  });

  it('after advent become "Advent 2026"', () => {
    const copy = calendarCopy(calendarAt(TOOLS, at(25)));
    expect(copy.heading).toBe('Advent 2026');
    expect(copy.strap).toBe('15 tools, one a day, 10 December to 24 December 2026');
    expect(adventCopy(calendarAt(TOOLS, at(25))).heading).toBe('Advent 2026');
    expect(adventCopy(calendarAt(TOOLS, at(25))).how.points[0]).toMatch(/^A door opened every day/);
  });
});

describe('about', () => {
  it('says who makes the tools and why they are free, and links to eurth.org', () => {
    const about = aboutCopy({ github: false });
    const words = JSON.stringify(about);
    expect(words).toContain('Orioni');
    expect(words).toContain('since 2004');
    expect(words).toMatch(/No ads, no analytics, no trackers, no cookies and no accounts/);
    expect(words).toContain('(https://eurth.org)');
  });

  it('links to GitHub only when the build says it may', () => {
    expect(JSON.stringify(aboutCopy({ github: false }))).not.toMatch(/github/i);
    expect(JSON.stringify(aboutCopy({ github: true }))).toContain('https://github.com/eurth-org');
  });
});

describe('your nation\'s words', () => {
  it('offer the card only with the tool the build passes in', () => {
    const card = liveTool(TOOLS, at(24), 'card');
    expect(card).toBeDefined();
    if (!card) return;
    expect(NATION.card(card)).toEqual({
      button: 'Open the card',
      href: 'https://card.eurth.org',
      note: "Card puts all of it on one page. Load the same file there: this page can't hand it over, because nothing leaves your device.",
    });
  });

  it('count sections in words', () => {
    expect(NATION.result('Calderwyn', 3, 3)).toBe('Calderwyn: 3 of 3 sections filled');
    expect(NATION.result('', 0, 1)).toBe('Your nation: 0 of 1 section filled');
    expect(NATION.open('Flagwright')).toBe('Open in Flagwright');
    expect(NATION.make('Governmint')).toBe('Make one in Governmint');
  });
});

describe('llms.txt', () => {
  it('lists the live tools and the pages', () => {
    const moment = at(10);
    const lines = llmsLines(liveTools(TOOLS, moment), calendarAt(TOOLS, moment));
    expect(lines).toContain('- [Flagwright](https://flag.eurth.org/): Flags made to fly');
    expect(lines).toContain('- [Arms](https://arms.eurth.org/): Coats of arms that follow the rules');
    expect(lines).toContain('(https://tools.eurth.org/advent/)');
    expect(lines).not.toContain('seats.eurth.org');
  });
});

describe('links in paragraphs', () => {
  it('are split from the text around them', () => {
    expect(segments('Made for [Eurth](https://eurth.org), since 2004.')).toEqual([{ text: 'Made for ' }, { text: 'Eurth', href: 'https://eurth.org' }, { text: ', since 2004.' }]);
    expect(segments('No links here.')).toEqual([{ text: 'No links here.' }]);
    expect(segments('[Eurth](https://eurth.org)')).toEqual([{ text: 'Eurth', href: 'https://eurth.org' }]);
  });

  it('only ever lead to https addresses', () => {
    expect(segments('[click](javascript:alert(1)) and [this](http://example.org)')).toEqual([{ text: '[click](javascript:alert(1)) and [this](http://example.org)' }]);
  });

  it('are well formed in every paragraph of the about page', () => {
    for (const section of aboutCopy({ github: true }).sections) {
      for (const paragraph of section.paragraphs) {
        const text = segments(paragraph).map((segment) => segment.text).join('');
        expect(text, paragraph).not.toMatch(/[[\]()]/);
      }
    }
  });
});
