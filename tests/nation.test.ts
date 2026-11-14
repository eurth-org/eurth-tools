import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import file from '../src/data/sections.json' with { type: 'json' };
import { checkFile, describeNation, isFilled, MAX_FILE_BYTES, moreLine, readProfile, type LiveSection, type Nation } from '../src/hub/nation.js';
import { checkSections, liveSections, type SectionInfo } from '../src/hub/sections.js';
import { describeFinding, findSpoilers, secretsAt } from '../src/hub/spoilers.js';
import { at, everythingIn, TOOLS } from './helpers.js';

const SECTIONS = file.sections as SectionInfo[];
const example = (name: string) => readFileSync(new URL(`./fixtures/profiles/${name}.eurth.json`, import.meta.url), 'utf8');
const read = (text: string, live: LiveSection[]): Nation => {
  const result = readProfile(text, live);
  if (!result.ok) throw new Error(result.message);
  return result.nation;
};
const refused = (text: string): string => {
  const result = readProfile(text, liveSections(SECTIONS, TOOLS, at(9)));
  return result.ok ? '' : result.message;
};

describe('the sections file', () => {
  it('is sound and covers the sixteen sections of the profile, in its order', () => {
    expect(checkSections(SECTIONS, TOOLS)).toEqual([]);
    expect(SECTIONS.map((info) => info.section)).toEqual(['identity', 'flag', 'arms', 'government', 'seats', 'names', 'stats', 'dynasty', 'calendar', 'timeline', 'bank', 'passport', 'rank', 'cities', 'anthem', 'wiki']);
  });

  it('gives each section to the tool that writes it', () => {
    const owner = Object.fromEntries(SECTIONS.map((info) => [info.section, info.tool]));
    expect(owner).toMatchObject({ flag: 'flag', government: 'gov', calendar: 'cal', timeline: 'time', identity: 'wiki', dynasty: 'dynasty' });
  });

  it('has its faults pointed out by place', () => {
    const problems = (patch: Record<string, unknown>) => checkSections([{ section: 'flag', label: 'Flag', tool: 'flag', ...patch }], TOOLS).join(' ');
    expect(problems({})).toBe('');
    expect(problems({ section: 'meta' })).toMatch(/Section 1 is meta/);
    expect(problems({ section: '' })).toMatch(/no usable key/);
    expect(problems({ label: ' ' })).toMatch(/no label/);
    expect(problems({ tool: 'nonesuch' })).toMatch(/isn't in the list of tools/);
    expect(problems({ always: 'yes' })).toMatch(/isn't true or false/);
    expect(checkSections([{ section: 'flag', label: 'Flag', tool: 'flag' }, { section: 'flag', label: 'Flag', tool: 'flag' }], TOOLS)).toEqual(['Section 2 repeats a key.']);
    expect(checkSections(['flag'], TOOLS)).toEqual(["Section 1 isn't an object."]);
  });
});

describe('the sections the page may know', () => {
  it('on 9 December are identity, without a link, and the two live tools', () => {
    expect(liveSections(SECTIONS, TOOLS, at(9))).toEqual([
      { section: 'identity', label: 'Identity' },
      { section: 'flag', label: 'Flag', tool: { name: 'Flagwright', url: 'https://flag.eurth.org', host: 'flag.eurth.org' } },
      { section: 'government', label: 'Government', tool: { name: 'Governmint', url: 'https://gov.eurth.org', host: 'gov.eurth.org' } },
    ]);
  });

  it('grow by a section as each door opens, and identity gains its tool on the 23rd', () => {
    expect(liveSections(SECTIONS, TOOLS, at(10)).map((s) => s.section)).toEqual(['identity', 'flag', 'arms', 'government']);
    expect(liveSections(SECTIONS, TOOLS, at(15)).map((s) => s.section)).toEqual(['identity', 'flag', 'arms', 'government', 'seats', 'names', 'stats', 'dynasty', 'cities']);
    expect(liveSections(SECTIONS, TOOLS, at(22))[0]?.tool).toBeUndefined();
    expect(liveSections(SECTIONS, TOOLS, at(23))[0]?.tool?.name).toBe('Wiki');
    expect(liveSections(SECTIONS, TOOLS, at(25))).toHaveLength(16);
  });

  it.each(Array.from({ length: 17 }, (_, i) => i + 9))('on %i December hold nothing about a locked tool', (day) => {
    const moment = at(day);
    const live = liveSections(SECTIONS, TOOLS, moment);
    const secrets = secretsAt(TOOLS, moment);
    const kinds = ['address', 'pitch', 'name', 'id'] as const;
    expect(findSpoilers(everythingIn(live), secrets, { kinds }).map(describeFinding)).toEqual([]);
    // And neither does what the page makes of a profile that is filled in everywhere.
    const nation = read(example('calderwyn'), live);
    expect(findSpoilers(everythingIn(nation), secrets, { kinds }).map(describeFinding)).toEqual([]);
    expect(findSpoilers(describeNation(nation, false), secrets, { kinds }).map(describeFinding)).toEqual([]);
  });
});

describe('reading a profile', () => {
  const opening = liveSections(SECTIONS, TOOLS, at(9));
  const everything = liveSections(SECTIONS, TOOLS, at(25));

  it('reads the smallest example: a name and a flag', () => {
    const nation = read(example('hesperwick'), opening);
    expect(nation.name).toBe('Hesperwick');
    expect(nation.filled).toEqual([
      { section: 'flag', label: 'Flag', href: 'https://flag.eurth.org/#example-hesperwick', toolName: 'Flagwright', summary: 'A white Nordic cross on sea green, with a gold border to the cross.' },
    ]);
    expect(nation.empty).toEqual([
      { section: 'identity', label: 'Identity' },
      { section: 'government', label: 'Government', href: 'https://gov.eurth.org', toolName: 'Governmint' },
    ]);
    expect(nation.more).toBe(0);
  });

  it('on 9 December shows three sections of the full example and counts the other thirteen', () => {
    const nation = read(example('calderwyn'), opening);
    expect(nation.name).toBe('Calderwyn');
    expect(nation.filled.map((s) => s.label)).toEqual(['Identity', 'Flag', 'Government']);
    expect(nation.filled[0]?.href).toBeUndefined();
    expect(nation.empty).toEqual([]);
    expect(nation.more).toBe(13);
  });

  it('after advent shows all sixteen, each with its tool', () => {
    const nation = read(example('calderwyn'), everything);
    expect(nation.filled).toHaveLength(16);
    expect(nation.more).toBe(0);
    expect(nation.filled.every((s) => s.href?.startsWith('https://') && s.toolName)).toBe(true);
  });

  it('reads the mid-sized example', () => {
    const nation = read(example('vantmoor'), everything);
    expect(nation.filled.map((s) => s.section)).toEqual(['identity', 'flag', 'government', 'stats', 'cities']);
    expect(nation.empty).toHaveLength(11);
  });

  const profile = (sections: Record<string, unknown>) => JSON.stringify({ meta: { schema: 1, nation: 'Testland', updated: '2026-12-01T00:00:00Z' }, ...sections });

  it('follows a section\'s link only to its own tool, over https', () => {
    const href = (link: unknown) => read(profile({ flag: { link, svg: '<svg/>' } }), opening).filled[0]?.href;
    expect(href('https://flag.eurth.org/?f=abc')).toBe('https://flag.eurth.org/?f=abc');
    expect(href('https://evil.example/?f=abc')).toBe('https://flag.eurth.org');
    expect(href('http://flag.eurth.org/?f=abc')).toBe('https://flag.eurth.org');
    expect(href('https://flag.eurth.org.evil.example/')).toBe('https://flag.eurth.org');
    expect(href('https://user:pass@flag.eurth.org/')).toBe('https://flag.eurth.org');
    expect(href('javascript:alert(1)')).toBe('https://flag.eurth.org');
    expect(href(42)).toBe('https://flag.eurth.org');
    expect(href(`https://flag.eurth.org/?f=${'a'.repeat(4000)}`)).toBe('https://flag.eurth.org');
    expect(href(undefined)).toBe('https://flag.eurth.org');
  });

  it('says where the visitor came from on a link it follows', () => {
    const result = readProfile(profile({ flag: { link: 'https://flag.eurth.org/?f=abc', svg: '<svg/>' } }), opening, 'tools.eurth.org');
    expect(result.ok && result.nation.filled[0]?.href).toBe('https://flag.eurth.org/?f=abc&ref=tools.eurth.org');
  });

  it('shows summaries as plain text, tidied and cut to length', () => {
    const summary = (value: unknown) => read(profile({ flag: { summary: value, svg: '<svg/>' } }), opening).filled[0]?.summary;
    expect(summary('  A  red\n\tflag.\u0000 ')).toBe('A red flag.');
    expect(summary('<b>bold</b>')).toBe('<b>bold</b>');
    expect(summary('x'.repeat(700))).toHaveLength(600);
    expect(summary('x'.repeat(700))?.endsWith('…')).toBe(true);
    expect(summary(42)).toBeUndefined();
    expect(summary('')).toBeUndefined();
  });

  it('cuts an overlong name and copes without one', () => {
    expect(read(JSON.stringify({ meta: { schema: 1, nation: 'N'.repeat(200) } }), opening).name).toHaveLength(80);
    expect(read(JSON.stringify({ meta: { schema: 1 } }), opening).name).toBe('');
    expect(read(JSON.stringify({ meta: { schema: 1, nation: 7 } }), opening).name).toBe('');
  });

  it('counts a section as filled only when it says something', () => {
    expect(isFilled({ svg: '<svg/>' })).toBe(true);
    expect(isFilled({ colours: ['#fff'] })).toBe(true);
    expect(isFilled({ population: 0 })).toBe(true);
    expect(isFilled({ nested: { deep: 'yes' } })).toBe(true);
    expect(isFilled({})).toBe(false);
    expect(isFilled({ updated: '2026-12-01T00:00:00Z' })).toBe(false);
    expect(isFilled({ summary: '   ', colours: [], nested: {}, nothing: null })).toBe(false);
    expect(isFilled(null)).toBe(false);
    expect(isFilled('flag')).toBe(false);
    expect(isFilled(['flag'])).toBe(false);
    const nation = read(profile({ flag: { updated: '2026-12-01T00:00:00Z' }, government: {}, mystery: {}, other: { a: 1 } }), opening);
    expect(nation.filled).toEqual([]);
    expect(nation.more).toBe(1);
  });

  it('counts sections it has never heard of, and never names them', () => {
    const nation = read(profile({ flag: { svg: '<svg/>' }, dynasty: { house: 'Maravel' }, spaceProgramme: { rockets: 3 } }), opening);
    expect(nation.more).toBe(2);
    expect(everythingIn(nation)).not.toMatch(/dynasty|spaceProgramme|Maravel/);
  });

  it('is not fooled by a key named __proto__ or by inherited keys', () => {
    const nation = read('{"meta":{"schema":1,"nation":"Testland"},"__proto__":{"flag":{"svg":"x"}},"toString":{"a":1}}', opening);
    expect(nation.filled).toEqual([]);
    expect(nation.more).toBe(2);
    expect(({} as Record<string, unknown>).flag).toBeUndefined();
  });
});

describe('a file that is not a profile', () => {
  it('is turned away with a sentence, never an exception', () => {
    const notOne = "That file isn't a nation profile. Pick one that ends in .eurth.json.";
    expect(refused('')).toBe(notOne);
    expect(refused('not json')).toBe(notOne);
    expect(refused('[]')).toBe(notOne);
    expect(refused('null')).toBe(notOne);
    expect(refused('"text"')).toBe(notOne);
    expect(refused('{}')).toBe(notOne);
    expect(refused('{"meta":[]}')).toBe(notOne);
    expect(refused('{"meta":{}}')).toBe(notOne);
    expect(refused('{"meta":{"schema":"1"}}')).toBe(notOne);
    expect(refused('{"meta":{"schema":0}}')).toBe(notOne);
    expect(refused('{"meta":{"schema":1.5}}')).toBe(notOne);
  });

  it('from a newer format is turned away with a way forward', () => {
    expect(refused('{"meta":{"schema":2,"nation":"Tomorrow"}}')).toBe('That profile was saved in a newer format than this page knows. Reload the page and try again.');
  });

  it('over 2 MB is turned away before it is read', () => {
    const tooBig = 'That file is larger than 2 MB, which is more than a nation profile can be.';
    expect(refused(`{"meta":{"schema":1},"pad":"${'x'.repeat(MAX_FILE_BYTES)}"}`)).toBe(tooBig);
    expect(refused(`{"meta":{"schema":1},"pad":"${'é'.repeat(MAX_FILE_BYTES / 2)}"}`)).toBe(tooBig);
    expect(checkFile({ name: 'big.eurth.json', size: MAX_FILE_BYTES + 1 })).toBe(tooBig);
    expect(checkFile({ name: 'ok.eurth.json', size: MAX_FILE_BYTES })).toBeUndefined();
  });

  it('is spotted by its name or its emptiness', () => {
    expect(checkFile({ name: 'flag.png', size: 10 })).toMatch(/isn't a nation profile/);
    expect(checkFile({ name: 'empty.eurth.json', size: 0 })).toBe('That file is empty.');
    expect(checkFile({ name: 'ORIONI.EURTH.JSON', size: 10 })).toBeUndefined();
    expect(checkFile({ name: 'plain.json', size: 10 })).toBeUndefined();
  });
});

describe('the words for a nation', () => {
  it('count what cannot be named yet', () => {
    expect(moreLine(0, false)).toBe('');
    expect(moreLine(1, false)).toBe("And 1 more section, for a door that hasn't opened yet.");
    expect(moreLine(13, false)).toBe("And 13 more sections, for doors that haven't opened yet.");
    expect(moreLine(1, true)).toBe("And 1 more section from a tool this page doesn't know yet.");
    expect(moreLine(2, true)).toBe("And 2 more sections from tools this page doesn't know yet.");
  });

  it('describe the result in a sentence or two', () => {
    const opening = liveSections(SECTIONS, TOOLS, at(9));
    expect(describeNation(read(example('hesperwick'), opening), false)).toBe('Hesperwick has 1 of 3 sections filled: Flag. Still to do: Identity and Government.');
    expect(describeNation(read(example('calderwyn'), opening), false)).toBe("Calderwyn has 3 of 3 sections filled: Identity, Flag and Government. And 13 more sections, for doors that haven't opened yet.");
    expect(describeNation(read('{"meta":{"schema":1}}', opening), false)).toBe('This nation has none of 3 sections filled yet.');
  });
});
