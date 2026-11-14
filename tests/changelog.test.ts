import { describe, expect, it } from 'vitest';
import file from '../src/data/changelog.json' with { type: 'json' };
import { changelogAt, checkChangelog, type Release } from '../src/hub/changelog.js';
import { describeFinding, findSpoilers, secretsAt } from '../src/hub/spoilers.js';
import { at, everythingIn, TOOLS } from './helpers.js';

const RELEASES = file.releases as Release[];

describe('the changelog file', () => {
  it('is sound', () => {
    expect(checkChangelog(RELEASES, TOOLS)).toEqual([]);
    expect(RELEASES.length).toBeGreaterThan(20);
  });

  it('is kept newest first', () => {
    const days = RELEASES.map((release) => release.date);
    expect(days).toEqual([...days].sort().reverse());
    const sameDay = RELEASES.filter((release) => release.date === '2026-10-29' && release.time).map((release) => release.time);
    expect(sameDay).toEqual([...sameDay].sort().reverse());
  });

  it('covers every tool that is live today', () => {
    expect([...new Set(RELEASES.map((release) => release.tool))].sort()).toEqual(['flag', 'gov', 'map', 'news']);
  });

  it('names no locked tool, so nothing is held back when the hub opens', () => {
    const opening = at(9);
    const changelog = changelogAt(RELEASES, TOOLS, opening);
    expect(changelog.held).toEqual([]);
    expect(changelog.shown).toHaveLength(RELEASES.length);
    expect(findSpoilers(everythingIn(changelog), secretsAt(TOOLS, opening), { kinds: ['address', 'pitch', 'name', 'id'] }).map(describeFinding)).toEqual([]);
  });
});

describe('what is wrong with a changelog', () => {
  const good: Release = { tool: 'flag', date: '2026-12-01', title: 'A waving preview', notes: ['The flag waves.'] };
  const problems = (patch: Record<string, unknown>) => checkChangelog([{ ...good, ...patch }], TOOLS).join(' ');

  it('is said by the entry\'s place, not its tool', () => {
    expect(problems({ tool: 'nonesuch' })).toBe("Release 1 is for a tool that isn't in the list of tools.");
    expect(problems({ date: '1 December' })).toMatch(/isn't YYYY-MM-DD/);
    expect(problems({ date: '2026-02-30' })).toMatch(/doesn't exist/);
    expect(problems({ time: '25:00' })).toMatch(/isn't HH:MM/);
    expect(problems({ version: ' ' })).toMatch(/empty version/);
    expect(problems({ title: '' })).toMatch(/no title/);
    expect(problems({ title: 'A waving preview.' })).toMatch(/full stop/);
    expect(problems({ notes: [] })).toMatch(/at least one note/);
    expect(problems({ notes: ['fine', ''] })).toMatch(/at least one note/);
    expect(checkChangelog([null], TOOLS)).toEqual(["Release 1 isn't an object."]);
    expect(checkChangelog([good], TOOLS)).toEqual([]);
  });
});

describe('the changelog on a given day', () => {
  const extra: Release[] = [
    { tool: 'dynasty', date: '2026-12-20', title: 'Regencies', notes: ['A regent can stand in for a child monarch.'] },
    { tool: 'dynasty', date: '2026-12-15', version: '1.0.0', title: 'Dynasty opens', notes: ['Family trees with succession rules.'] },
    { tool: 'flag', date: '2026-12-12', title: 'Flags for your arms', notes: ['Flagwright reads the colours of your coat of arms from Arms.'] },
    { tool: 'flag', date: '2026-12-11', title: 'A waving preview', notes: ['The flag waves on a pole.'] },
    { tool: 'flag', date: '2026-12-11', title: 'Outlines as a setting', notes: ['Any layer can have an outline.'] },
    { tool: 'arms', date: '2026-11-30', title: 'Arms is ready', notes: ['Built ahead of its door.'] },
    ...RELEASES,
  ];
  const titles = (day: number, hour = 0) => changelogAt(extra, TOOLS, at(day, hour)).shown.map((release) => release.title);

  it('shows a release only once its tool has launched', () => {
    expect(titles(9)).not.toContain('Arms is ready');
    expect(titles(10)).toContain('Arms is ready');
    expect(titles(14, 23)).not.toContain('Dynasty opens');
    expect(titles(15)).toContain('Dynasty opens');
  });

  it('shows a release only once its day has come, even for a live tool', () => {
    expect(titles(10, 23)).not.toContain('A waving preview');
    expect(titles(11)).toContain('A waving preview');
    expect(titles(19)).not.toContain('Regencies');
    expect(titles(20)).toContain('Regencies');
  });

  it('holds back a release of a live tool that mentions a locked one', () => {
    const early = changelogAt([{ tool: 'flag', date: '2026-12-01', title: 'Ready for Arms', notes: ['Flagwright will read your coat of arms.'] }], TOOLS, at(9));
    expect(early.shown).toEqual([]);
    expect(early.held).toEqual([{ entry: 1, reason: 'it mentions a locked tool' }]);
    const byAddress = changelogAt([{ tool: 'flag', date: '2026-12-01', title: 'A new neighbour', notes: ['See arms.eurth.org.'] }], TOOLS, at(9));
    expect(byAddress.held).toEqual([{ entry: 1, reason: 'it mentions a locked tool' }]);
    expect(changelogAt([{ tool: 'flag', date: '2026-12-01', title: 'Ready for Arms', notes: ['Flagwright will read your coat of arms.'] }], TOOLS, at(10)).shown).toHaveLength(1);
  });

  it('says why each release is held, without naming anything', () => {
    const { held } = changelogAt(extra, TOOLS, at(9));
    expect(held).toEqual([
      { entry: 1, reason: 'its tool has not launched' },
      { entry: 2, reason: 'its tool has not launched' },
      { entry: 3, reason: 'its day has not come' },
      { entry: 4, reason: 'its day has not come' },
      { entry: 5, reason: 'its day has not come' },
      { entry: 6, reason: 'its tool has not launched' },
    ]);
    expect(changelogAt([{ tool: 'nonesuch', date: '2026-01-01', title: 'A ghost', notes: ['Boo.'] }], TOOLS, at(25)).held).toEqual([{ entry: 1, reason: 'its tool has not launched' }]);
  });

  it('puts the newest day first and keeps the file\'s order within a day', () => {
    const shown = changelogAt(extra, TOOLS, at(25)).shown;
    expect(shown.slice(0, 7).map((release) => release.title)).toEqual(['Regencies', 'Dynasty opens', 'Flags for your arms', 'A waving preview', 'Outlines as a setting', 'Arms is ready', 'Flagwright opens as a preview']);
    expect(shown[shown.length - 1]?.title).toBe('The map opens');
    const days = shown.map((release) => release.date);
    expect(days).toEqual([...days].sort().reverse());
  });

  it('gives every release the tool\'s name and address, a date in words and its own anchor', () => {
    const shown = changelogAt(extra, TOOLS, at(25)).shown;
    expect(shown[1]).toEqual({
      anchor: 'dynasty-2026-12-15',
      tool: { id: 'dynasty', name: 'Dynasty', url: 'https://dynasty.eurth.org', host: 'dynasty.eurth.org' },
      date: '2026-12-15',
      dateLabel: '15 December 2026',
      version: '1.0.0',
      title: 'Dynasty opens',
      notes: ['Family trees with succession rules.'],
    });
    expect(shown.filter((release) => release.date === '2026-12-11').map((release) => release.anchor)).toEqual(['flag-2026-12-11', 'flag-2026-12-11-2']);
    expect(new Set(shown.map((release) => release.anchor)).size).toBe(shown.length);
    expect('version' in (shown[0] ?? {})).toBe(false);
  });

  it.each(Array.from({ length: 17 }, (_, i) => i + 9))('on %i December holds nothing about a locked tool', (day) => {
    const moment = at(day);
    const changelog = changelogAt(extra, TOOLS, moment);
    expect(findSpoilers(everythingIn(changelog), secretsAt(TOOLS, moment), { kinds: ['address', 'pitch', 'name', 'id'] }).map(describeFinding)).toEqual([]);
  });

  it('goes by the Brussels day', () => {
    expect(changelogAt(extra, TOOLS, new Date('2026-12-10T22:59:59Z')).shown.map((release) => release.title)).not.toContain('A waving preview');
    expect(changelogAt(extra, TOOLS, new Date('2026-12-10T23:00:00Z')).shown.map((release) => release.title)).toContain('A waving preview');
  });
});
