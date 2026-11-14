// No cheating, no hints. The site is built once for every day from 9 to 25 December 2026, with
// the build's clock set to that day's midnight in Brussels, and every file of every build is
// searched for anything about a tool whose door is still closed on that day: its name, its
// address, its pitch, in HTML, scripts, JSON, the sitemap, llms.txt, the manifest, the service
// worker, comments, the props of components, the bytes of every picture and the paths of the
// files themselves.
//
// The build in dist/ (the one that is about to be deployed) is searched the same way, for the
// moment it was built for: the nightly run sets EURTH_BUILD_TIME, builds, and runs this.
//
// Seventeen builds take a minute or two. Set NO_HINTS_DAYS=skip to leave them out while
// working on something else; CI never does.
import { filesIn } from '@eurth/style/astro';
import { buildTime, everyTool } from '@eurth/style/build';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { midnightsBetween } from '../src/hub/clock.js';
import { describeFinding, isTextFile, scanFiles, secretsAt, type Allowance, type BuiltFile } from '../src/hub/spoilers.js';
import type { Tool } from '../src/hub/tools.js';

const TOOLS = everyTool() as Tool[];
const DAYS = midnightsBetween('2026-12-09', '2026-12-25');
const OUT = '.no-hints';
const SKIP = process.env.NO_HINTS_DAYS === 'skip';

/**
 * Reviewed exceptions: a capitalised everyday word that a library can't avoid, in one known
 * place. Each needs a reason, and the test fails if one stops matching anything. None so far.
 */
const ALLOW: Allowance[] = [];

/** Every file of a build. Text as text; anything else byte by byte, so pictures are searched too. */
function readBuild(dir: string): BuiltFile[] {
  return filesIn(dir).map((path) => ({ path, text: readFileSync(join(dir, path), isTextFile(path) ? 'utf8' : 'latin1') }));
}

/** Builds the site as it would be at a moment, into its own folder, the way the nightly run does. */
function buildFor(moment: string, dir: string): void {
  const env: NodeJS.ProcessEnv = { ...process.env, EURTH_BUILD_TIME: moment, NODE_ENV: 'production', PATH: `${dirname(process.execPath)}:${process.env.PATH ?? ''}` };
  // Vitest's own settings mustn't leak into the build.
  for (const key of Object.keys(env)) if (/^(VITEST|VITE_)/.test(key) || ['TEST', 'MODE', 'DEV', 'PROD', 'SSR', 'BASE_URL'].includes(key)) delete env[key];
  rmSync(dir, { recursive: true, force: true });
  execFileSync(process.execPath, [join('node_modules', 'astro', 'bin', 'astro.mjs'), 'build', '--outDir', dir], { env, stdio: 'pipe' });
}

const page = (dir: string, path: string) => readFileSync(join(dir, path), 'utf8');
const count = (text: string, pattern: RegExp) => text.match(pattern)?.length ?? 0;
const OPEN = /class="[^"]*\bdoor--open\b/g;
const LOCKED = /class="[^"]*\bdoor--locked\b/g;
const TODAY = /class="[^"]*\bdoor--today\b/g;
const dayOf = (moment: string) => moment.slice(0, 10);
const dirOf = (moment: string) => join(OUT, dayOf(moment));
/** How many doors are due on a day: none on the 9th, one on the 10th, all fifteen from the 24th. */
const due = (moment: string) => Math.max(0, Math.min(15, Number(dayOf(moment).slice(8)) - 9));

describe.skipIf(SKIP)('no hints: the site built for every day from 9 to 25 December', () => {
  beforeAll(() => {
    for (const moment of DAYS) buildFor(moment, dirOf(moment));
  }, 45 * 60_000);

  it('is seventeen builds', () => {
    expect(DAYS).toHaveLength(17);
    for (const moment of DAYS) expect(existsSync(join(dirOf(moment), 'index.html')), dayOf(moment)).toBe(true);
  });

  it.each(DAYS)('built for %s, no file gives a locked door away', (moment) => {
    const files = readBuild(dirOf(moment));
    expect(files.length).toBeGreaterThan(20);
    const { findings } = scanFiles(files, secretsAt(TOOLS, new Date(moment)), ALLOW);
    expect(findings.map(describeFinding)).toEqual([]);
  });

  it.each(DAYS)('built for %s, exactly the doors that are due are open', (moment) => {
    for (const path of ['index.html', 'advent/index.html']) {
      const html = page(dirOf(moment), path);
      expect(count(html, OPEN), `${path}: open doors`).toBe(due(moment));
      expect(count(html, LOCKED), `${path}: locked doors`).toBe(15 - due(moment));
      const todays = due(moment) >= 1 && dayOf(moment) <= '2026-12-24' ? 1 : 0;
      expect(count(html, TODAY), `${path}: today's door`).toBe(todays);
      expect(count(html, /Open today/g), `${path}: "Open today"`).toBe(todays);
      expect(count(html, /Opens \d+ Dec/g), `${path}: "Opens …"`).toBe(15 - due(moment));
    }
  });

  it('on the 9th, the day the hub opens, every door is locked and only the four live tools are named', () => {
    const html = page(dirOf(DAYS[0] ?? ''), 'index.html');
    expect(count(html, LOCKED)).toBe(15);
    expect(count(html, /class="[^"]*\blive-card\b/g)).toBe(4);
    for (const name of ['Map', 'Newsroom', 'Governmint', 'Flagwright']) expect(html).toContain(name);
  });

  it('each day lists the tools that are live, one more each day', () => {
    for (const moment of DAYS) expect(count(page(dirOf(moment), 'index.html'), /class="[^"]*\blive-card\b/g), dayOf(moment)).toBe(4 + due(moment));
  });

  it('after the 24th the calendar is "Advent 2026", with every door open and none marked', () => {
    const html = page(dirOf(DAYS[16] ?? ''), 'advent/index.html');
    expect(html).toMatch(/<h1[^>]*>Advent 2026<\/h1>/);
    expect(count(html, OPEN)).toBe(15);
    expect(count(html, TODAY)).toBe(0);
  });

  it('the sharing image is the same picture on every day: fifteen closed doors', () => {
    const hashes = new Set(DAYS.map((moment) => createHash('sha256').update(readFileSync(join(dirOf(moment), 'og.png'))).digest('hex')));
    expect(hashes.size).toBe(1);
  });

  it('the sitemap lists the same four pages on every day', () => {
    for (const moment of DAYS) {
      const pages = [...page(dirOf(moment), 'sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
      expect(pages, dayOf(moment)).toEqual(['https://tools.eurth.org/', 'https://tools.eurth.org/about/', 'https://tools.eurth.org/advent/', 'https://tools.eurth.org/changelog/']);
    }
  });

  it('"Open the card" appears only once that door has opened', () => {
    for (const moment of DAYS) expect(page(dirOf(moment), 'index.html').includes('Open the card'), dayOf(moment)).toBe(dayOf(moment) >= '2026-12-24');
  });

  it('no page links to GitHub before 25 December', () => {
    for (const moment of DAYS) {
      const linked = ['index.html', 'about/index.html'].some((path) => /href="https:\/\/github\.com/.test(page(dirOf(moment), path)));
      expect(linked, dayOf(moment)).toBe(dayOf(moment) >= '2026-12-25');
    }
  });

  it('every exception on the list is still needed', () => {
    const used = new Set<Allowance>();
    for (const moment of DAYS) {
      const { unused } = scanFiles(readBuild(dirOf(moment)), secretsAt(TOOLS, new Date(moment)), ALLOW);
      for (const allowance of ALLOW) if (!unused.includes(allowance)) used.add(allowance);
    }
    expect(ALLOW.filter((allowance) => !used.has(allowance))).toEqual([]);
  });
});

describe.skipIf(!existsSync(join('dist', 'index.html')))('no hints: the build in dist/', () => {
  it('gives nothing away at the moment it was built for', () => {
    const { findings } = scanFiles(readBuild('dist'), secretsAt(TOOLS, buildTime()), ALLOW);
    expect(findings.map(describeFinding)).toEqual([]);
  });
});
