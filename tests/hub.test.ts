import { describe, expect, it } from 'vitest';
import changelog from '../src/data/changelog.json' with { type: 'json' };
import sections from '../src/data/sections.json' with { type: 'json' };
import { adventCopy, homeCopy, llmsLines, NATION } from '../src/content/copy.js';
import type { Release } from '../src/hub/changelog.js';
import { midnightsBetween } from '../src/hub/clock.js';
import { hubAt, type HubData } from '../src/hub/index.js';
import type { SectionInfo } from '../src/hub/sections.js';
import { describeFinding, scanFiles, secretsAt, type BuiltFile } from '../src/hub/spoilers.js';
import { TOOLS } from './helpers.js';

const DATA: HubData = { tools: TOOLS, releases: changelog.releases as Release[], sections: sections.sections as SectionInfo[] };

/**
 * A rehearsal of the no-hints test, before there is a site to build: everything a build for a
 * given moment could print, laid out as the files it would end up in. The real test (Phase 2)
 * runs the same scanner over the real dist/ of every day.
 */
function rehearse(moment: Date): BuiltFile[] {
  const hub = hubAt(DATA, moment);
  const home = { copy: homeCopy(hub.calendar), calendar: hub.calendar, live: hub.live, sections: hub.sections, card: hub.card ? NATION.card(hub.card) : null };
  return [
    { path: 'index.html', text: JSON.stringify(home) },
    { path: 'advent/index.html', text: JSON.stringify({ copy: adventCopy(hub.calendar), calendar: hub.calendar }) },
    { path: 'changelog/index.html', text: JSON.stringify(hub.releases) },
    { path: '_astro/Nation.js', text: JSON.stringify(hub.sections) },
    { path: 'llms.txt', text: llmsLines(hub.live, hub.calendar) },
    { path: 'sitemap-0.xml', text: ['/', '/advent/', '/changelog/', '/about/'].map((path) => `<loc>https://tools.eurth.org${path}</loc>`).join('') },
  ];
}

describe('the hub, for every day from 9 to 25 December', () => {
  const days = midnightsBetween('2026-12-09', '2026-12-25');

  it('is built seventeen times', () => {
    expect(days).toHaveLength(17);
  });

  it.each(days)('built for %s gives nothing away', (day) => {
    const moment = new Date(day);
    const { findings, unused } = scanFiles(rehearse(moment), secretsAt(TOOLS, moment));
    expect(findings.map(describeFinding)).toEqual([]);
    expect(unused).toEqual([]);
  });

  it.each(days)('built for %s opens exactly the doors that are due', (day) => {
    const moment = new Date(day);
    const hub = hubAt(DATA, moment);
    const due = Math.max(0, Math.min(15, Number(day.slice(8, 10)) - 9));
    expect(hub.calendar.open).toBe(due);
    expect(hub.live).toHaveLength(4 + due);
    expect(hub.calendar.doors.filter((door) => door.state === 'open').map((door) => door.door)).toEqual(Array.from({ length: due }, (_, i) => i + 1));
    expect(hub.calendar.today).toBe(due >= 1 && day < '2026-12-25' ? due : undefined);
    expect(Boolean(hub.card)).toBe(day >= '2026-12-24');
  });

  it('on the 9th names no advent tool at all', () => {
    const hub = hubAt(DATA, new Date(days[0] ?? ''));
    expect(hub.live.map((tool) => tool.name)).toEqual(['Map', 'Newsroom', 'Governmint', 'Flagwright']);
    expect(hub.calendar.doors.every((door) => door.state === 'locked')).toBe(true);
    expect(hub.sections.map((section) => section.section)).toEqual(['identity', 'flag', 'government']);
    expect(hub.card).toBeUndefined();
    expect(hub.heldReleases).toBe(0);
  });

  it('would catch a leak if there were one', () => {
    const moment = new Date('2026-12-13T00:00:00+01:00');
    const files = rehearse(moment);
    const tomorrow = hubAt(DATA, new Date('2026-12-14T00:00:00+01:00')).calendar;
    const leaked = [...files, { path: 'advent/data.json', text: JSON.stringify(tomorrow) }];
    const found = scanFiles(leaked, secretsAt(TOOLS, moment)).findings;
    expect(found.map((finding) => `${finding.file}: ${finding.kind} ${finding.ref}`).sort()).toEqual([
      'advent/data.json: address door 5',
      'advent/data.json: address door 5',
      'advent/data.json: name door 5',
      'advent/data.json: name door 5',
      'advent/data.json: pitch door 5',
      'advent/data.json: pitch door 5',
    ]);
  });

  it('says when it was built for', () => {
    expect(hubAt(DATA, new Date('2026-12-10T00:00:00+01:00')).builtFor).toBe('2026-12-09T23:00:00.000Z');
  });
});
