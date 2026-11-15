import { describe, expect, it } from 'vitest';
import { decode, describeFinding, findPathSpoilers, findSpoilers, isTextFile, scanFiles, secretsAt, type Allowance, type Secret } from '../src/hub/spoilers.js';
import { at, TOOLS } from './helpers.js';

const BEFORE = secretsAt(TOOLS, at(9));
const secret = (id: string): Secret[] => BEFORE.filter((s) => s.id === id);
const kindsFound = (text: string, secrets: Secret[] = BEFORE, kinds?: Parameters<typeof findSpoilers>[2]) => findSpoilers(text, secrets, kinds).map((f) => `${f.kind} ${f.ref}`);

describe('what is secret', () => {
  it('on 9 December is all fifteen doors, and never the hub itself', () => {
    expect(BEFORE.map((s) => s.ref)).toEqual(Array.from({ length: 15 }, (_, i) => `door ${i + 1}`));
    expect(BEFORE.some((s) => s.id === 'tools')).toBe(false);
  });

  it('shrinks by one door a day and is empty from the 24th', () => {
    expect(secretsAt(TOOLS, at(10)).map((s) => s.ref)[0]).toBe('door 2');
    expect(secretsAt(TOOLS, at(23))).toHaveLength(1);
    expect(secretsAt(TOOLS, at(24))).toEqual([]);
  });

  it('before the hub launches still lets the hub name itself, and hides a tool without a door by its place', () => {
    const november = secretsAt(TOOLS, new Date('2026-11-14T12:00:00+01:00'));
    expect(november).toHaveLength(15);
    const early = secretsAt(TOOLS, new Date('2026-11-01T12:00:00+01:00'), 'gov');
    expect(early.map((s) => s.ref)).toContain('entry 4');
    expect(early.map((s) => s.ref)).toContain('entry 5');
  });
});

describe('addresses', () => {
  it('are found as hosts, as links and in any case', () => {
    expect(kindsFound('<a href="https://dynasty.eurth.org/?ref=tools.eurth.org">', secret('dynasty'))).toEqual(['address door 6']);
    expect(kindsFound('see DYNASTY.EURTH.ORG', secret('dynasty'))).toEqual(['address door 6', 'name door 6']);
    expect(kindsFound('{"url":"https:\\/\\/cal.eurth.org"}', secret('cal'))).toEqual(['address door 7']);
    expect(kindsFound('https%3A%2F%2Fcal.eurth.org', secret('cal'))).toEqual(['address door 7']);
  });

  it('are found when split at an invisible break', () => {
    expect(kindsFound('dynasty.<wbr>eurth.<wbr />org', secret('dynasty'))).toEqual(['address door 6']);
    expect(kindsFound('dynasty.<wbr data-astro-cid-g47lu57g>eurth.<wbr data-astro-cid-g47lu57g>org', secret('dynasty'))).toEqual(['address door 6']);
    expect(kindsFound('dyn&shy;asty.eurth.org and dynasty.\u200beurth.org', secret('dynasty'))).toEqual(['address door 6', 'address door 6']);
    expect(kindsFound('Dyn\u00adasty and Dy&#173;nasty and Dyn&#x200B;asty', secret('dynasty'))).toEqual(['name door 6', 'name door 6', 'name door 6']);
  });

  it('are not confused with the addresses of open tools', () => {
    expect(kindsFound('https://flag.eurth.org https://tools.eurth.org https://eurth.org')).toEqual([]);
  });
});

describe('pitches', () => {
  it('are found in any case and across line breaks', () => {
    expect(kindsFound('<p>who gets\n      the crown?</p>', secret('dynasty'))).toEqual(['pitch door 6']);
    expect(kindsFound('TURN VOTES INTO SEATS', secret('seats'))).toEqual(['pitch door 2', 'name door 2']);
    expect(kindsFound('Turn Votes Into seats', secret('seats'))).toEqual(['pitch door 2']);
  });

  it('are found through HTML entities, JSON escapes and curly apostrophes', () => {
    expect(kindsFound('Money with your nation&#39;s face on it', secret('bank'))).toEqual(['pitch door 9']);
    expect(kindsFound('Money with your nation&#x27;s face on it', secret('bank'))).toEqual(['pitch door 9']);
    expect(kindsFound('Money with your nation&apos;s face on it', secret('bank'))).toEqual(['pitch door 9']);
    expect(kindsFound('Money with your nation’s face on it', secret('bank'))).toEqual(['pitch door 9']);
    expect(kindsFound('"Money with your nation\\u0027s face on it"', secret('bank'))).toEqual(['pitch door 9']);
    expect(kindsFound("'Money with your nation\\'s face on it'", secret('bank'))).toEqual(['pitch door 9']);
    expect(kindsFound('Is my nation&nbsp;realistic?', secret('stats'))).toEqual(['pitch door 5']);
  });

  it('are found inside share links', () => {
    expect(kindsFound('https://example.org/share?text=Who%20gets%20the%20crown%3F', secret('dynasty'))).toEqual(['pitch door 6']);
    expect(kindsFound('?text=Who+gets+the+crown%3F', secret('dynasty'))).toEqual(['pitch door 6']);
  });
});

describe('names', () => {
  it('are found as whole words with their capital', () => {
    expect(kindsFound('<span>Dynasty</span>', secret('dynasty'))).toEqual(['name door 6']);
    expect(kindsFound('Open Dynasty, then', secret('dynasty'))).toEqual(['name door 6']);
    expect(kindsFound("Dynasty's line", secret('dynasty'))).toEqual(['name door 6']);
    expect(kindsFound('DYNASTY', secret('dynasty'))).toEqual(['name door 6']);
    expect(kindsFound('{"name":"Card"}', secret('card'))).toEqual(['name door 15']);
    expect(kindsFound('&quot;Card&quot;', secret('card'))).toEqual(['name door 15']);
  });

  it('let everyday words through in lower case', () => {
    const copy = 'The worldbuilding advent calendar. A door opens every day at midnight, Brussels time. Passports and ID cards. Open the card. Its names, its cities, its arms, its seats, its stats, its rank, its bank, its wiki, its anthem, a dynasty, a passport, some prompts.';
    expect(kindsFound(copy)).toEqual([]);
  });

  it('let longer words and identifiers that contain a name through', () => {
    const code = 'const startTime = performance.now(); new Intl.DateTimeFormat(); el.classNames; Timeline; Cards; Ranking; Banking; Armstrong; Wikipedia; iiwiki.com; _Time; Time2';
    expect(kindsFound(code)).toEqual([]);
  });

  it('catch a capital at the start of a sentence, so the copy has to avoid one', () => {
    expect(kindsFound('Time flies. Names matter. Calendar of events.')).toEqual(['name door 8', 'name door 3', 'name door 7']);
  });

  it('stop being secret the day the door opens', () => {
    expect(kindsFound('Arms: coats of arms that follow the rules, at arms.eurth.org', secretsAt(TOOLS, at(10)))).toEqual([]);
    expect(kindsFound('Arms: coats of arms that follow the rules, at arms.eurth.org', secretsAt(TOOLS, at(9, 23, 59, 59))).sort()).toEqual(['address door 1', 'name door 1', 'pitch door 1']);
  });
});

describe('ids', () => {
  it('are only looked for when asked', () => {
    expect(kindsFound('{"id":"dynasty"}', secret('dynasty'))).toEqual([]);
  });

  it('are found as quoted strings, path segments and fragments', () => {
    const ids = { kinds: ['id'] as const };
    expect(kindsFound('{"id":"dynasty"}', secret('dynasty'), ids)).toEqual(['id door 6']);
    expect(kindsFound("section: 'dynasty'", secret('dynasty'), ids)).toEqual(['id door 6']);
    expect(kindsFound('data-door=&quot;dynasty&quot;', secret('dynasty'), ids)).toEqual(['id door 6']);
    expect(kindsFound('<img src="/doors/dynasty.png">', secret('dynasty'), ids)).toEqual(['id door 6']);
    expect(kindsFound('<a href="#dynasty">', secret('dynasty'), ids)).toEqual(['id door 6']);
    expect(kindsFound('a dynasty of dynasties', secret('dynasty'), ids)).toEqual([]);
  });
});

describe('findings', () => {
  it('never repeat the secret', () => {
    const findings = findSpoilers('Dynasty: who gets the crown? https://dynasty.eurth.org', secret('dynasty'), { file: 'index.html' });
    expect(findings).toHaveLength(3);
    for (const finding of findings) {
      const said = describeFinding(finding) + JSON.stringify(finding);
      expect(said).not.toMatch(/dynasty|crown/i);
      expect(said).toContain('door 6');
      expect(said).toContain('index.html');
    }
  });

  it('come in the order they stand in the file', () => {
    const findings = findSpoilers('Seats, then Arms, then Seats again', BEFORE);
    expect(findings.map((f) => f.ref)).toEqual(['door 2', 'door 1', 'door 2']);
    expect(findings[0]?.offset).toBe(0);
  });
});

describe('entities', () => {
  it('are decoded, and nonsense is left alone', () => {
    expect(decode('&amp;&lt;&gt;&quot;&#65;&#x42;\\u0043')).toBe('&<>"ABC');
    expect(decode('&bogus; &#0; &#x110000;')).toBe('&bogus; &#0; &#x110000;');
  });
});

describe('paths', () => {
  it('give a door away by a folder, a file name or a host', () => {
    expect(findPathSpoilers(['doors/dynasty.png', '_astro/Dynasty.B3x9.js', 'og/door-6.png', 'index.html', 'img/dynasty.eurth.org.webp'], secret('dynasty')).map((f) => f.file)).toEqual(['doors/dynasty.png', '_astro/Dynasty.B3x9.js', 'img/dynasty.eurth.org.webp']);
  });

  it('leave ordinary files alone', () => {
    expect(findPathSpoilers(['index.html', 'advent/index.html', 'changelog/index.html', 'about/index.html', '_astro/Nation.Dk2a.js', 'sitemap-0.xml', 'og.png', 'timeline.css'], BEFORE)).toEqual([]);
  });

  it('are described without the name', () => {
    const [finding] = findPathSpoilers(['doors/dynasty.png'], secret('dynasty'));
    expect(finding && describeFinding(finding)).toMatch(/behind door 6/);
  });
});

describe('a whole build', () => {
  const clean = [
    { path: 'index.html', text: '<h1>Free worldbuilding tools</h1><div role="img" aria-label="Door 6, opens 15 Dec">6 · Opens 15 Dec</div>' },
    { path: 'sitemap-0.xml', text: '<loc>https://tools.eurth.org/advent/</loc>' },
    { path: 'og.png', text: '\u0089PNG\r\n\u001a\n....Time....Card....' },
  ];

  it('passes when nothing is given away', () => {
    expect(scanFiles(clean, BEFORE)).toEqual({ findings: [], unused: [] });
  });

  it('looks in every kind of file', () => {
    const leaky = [
      ...clean,
      { path: 'llms.txt', text: '- Dynasty' },
      { path: '_astro/hub.js', text: 'const d=[{u:"https://passport.eurth.org"}]' },
      { path: 'og-advent.png', text: '\u0089PNG tEXtDescription\u0000Your world, your weeks' },
      { path: 'manifest.webmanifest', text: '{"shortcuts":[{"name":"Bank"}]}' },
      { path: 'index.html', text: '<!-- door 13: A worldbuilding prompt a day -->' },
      { path: 'doors/anthem.svg', text: '<svg/>' },
    ];
    expect(scanFiles(leaky, BEFORE).findings.map((f) => `${f.file}: ${f.kind} ${f.ref}`).sort()).toEqual([
      '_astro/hub.js: address door 10',
      'doors/anthem.svg: path door 12',
      'index.html: pitch door 13',
      'llms.txt: name door 6',
      'manifest.webmanifest: name door 9',
      'og-advent.png: pitch door 7',
    ]);
  });

  it('reads pictures for addresses and pitches only, since random bytes can spell a short name', () => {
    expect(scanFiles([{ path: 'og.png', text: '....Time....Rank....' }], BEFORE).findings).toEqual([]);
    expect(scanFiles([{ path: 'og.png', text: '....rank.eurth.org....' }], BEFORE).findings).toHaveLength(1);
  });

  it('knows text from pictures', () => {
    for (const path of ['index.html', '_astro/a.js', 'sw.js', 'a.css', 'manifest.webmanifest', 'robots.txt', 'llms.txt', 'sitemap-index.xml', 'favicon.svg', '_headers', 'a.js.map']) expect(isTextFile(path), path).toBe(true);
    for (const path of ['og.png', 'favicon.ico', 'icon-192.png', 'photo.webp', 'font.woff2']) expect(isTextFile(path), path).toBe(false);
  });

  const allowance: Allowance = { kind: 'name', id: 'time', file: /^_astro\/.*\.js$/, context: 'toLocale', why: 'A method name in the runtime.' };

  it('lets a reviewed exception through, in its own file and context only', () => {
    const files = [{ path: '_astro/runtime.js', text: 'x.toLocale("Time")' }];
    expect(scanFiles(files, BEFORE, [allowance])).toEqual({ findings: [], unused: [] });
    expect(scanFiles([{ path: 'index.html', text: 'x.toLocale("Time")' }], BEFORE, [allowance]).findings).toHaveLength(1);
    expect(scanFiles([{ path: '_astro/runtime.js', text: '<h2>Time</h2>' }], BEFORE, [allowance]).findings).toHaveLength(1);
    expect(scanFiles([{ path: '_astro/runtime.js', text: 'x.toLocale("Card")' }], BEFORE, [allowance]).findings).toHaveLength(1);
  });

  it('reports an exception that no longer matches anything', () => {
    expect(scanFiles(clean, BEFORE, [allowance]).unused).toEqual([allowance]);
  });
});
