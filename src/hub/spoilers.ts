/**
 * The no-hints scanner: does a built file say anything about a tool whose door is still closed?
 *
 * For each locked tool it looks for
 *   - its address: the host ("dynasty.eurth.org"), in any case, which also catches the full URL;
 *   - its pitch, in any case, through HTML entities, JSON escapes, URL encoding and line breaks;
 *   - its name as a whole word with its capital ("Dynasty", "DYNASTY"). Lower case is let
 *     through on purpose: several names are everyday words, and "the advent calendar" or
 *     "ID cards" gives nothing away;
 *   - and, where asked, its id as a quoted string, a path segment or a fragment ("dynasty").
 * The paths of the files are checked too ("doors/dynasty.png").
 *
 * A finding says which file, which door and what kind, and never repeats the secret itself, so
 * a failing CI log is not a spoiler either. BUILD AND TEST TIME ONLY: this module is handed the
 * very names it guards.
 */
import { hasLaunched, hostOf, type Tool } from './tools.js';

export type SpoilerKind = 'address' | 'pitch' | 'name' | 'id' | 'path';

/** A locked tool, as the scanner needs it. */
export interface Secret {
  /** How to speak of it without naming it: "door 6", or "entry 5" for a tool without a door. */
  ref: string;
  id: string;
  name: string;
  host: string;
  pitch: string;
}

export interface Finding {
  file: string;
  /** "door 6" */
  ref: string;
  kind: SpoilerKind;
  /** Roughly where, in characters from the start of the decoded text. */
  offset: number;
}

/**
 * A reviewed exception: a word a library can't avoid, in one known place. Keep the list short;
 * scanFiles reports every allowance that no longer matches anything.
 */
export interface Allowance {
  kind: SpoilerKind;
  /** The tool's id. */
  id: string;
  /** Which files it holds for; all of them if left out. */
  file?: RegExp;
  /** Text that must stand within 60 characters of the match, as it appears decoded. */
  context: string;
  /** Why this is not a hint. */
  why: string;
}

export interface ScanOptions {
  file?: string;
  /** What to look for. Default: address, pitch and name. */
  kinds?: readonly SpoilerKind[];
  allow?: readonly Allowance[];
}

const DEFAULT_KINDS: readonly SpoilerKind[] = ['address', 'pitch', 'name'];
const NEAR = 60;

/**
 * The tools no file may mention at this moment.
 * @param self the site's own id: a site may always name itself
 */
export function secretsAt(tools: readonly Tool[], at: Date, self = 'tools'): Secret[] {
  const secrets: Secret[] = [];
  tools.forEach((tool, i) => {
    if (tool.id === self || hasLaunched(tool, at)) return;
    secrets.push({ ref: tool.door !== undefined ? `door ${tool.door}` : `entry ${i + 1}`, id: tool.id, name: tool.name, host: hostOf(tool), pitch: tool.pitch });
  });
  return secrets;
}

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', rsquo: "'", lsquo: "'" };

/** HTML entities and JSON escapes turned back into the characters they stand for. */
export function decode(text: string): string {
  return text
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\(["'/])/g, '$1')
    .replace(/&#x([0-9a-fA-F]{1,6});/g, (whole, hex: string) => fromCodePoint(parseInt(hex, 16), whole))
    .replace(/&#(\d{1,7});/g, (whole, digits: string) => fromCodePoint(Number(digits), whole))
    .replace(/&([a-z]+);/g, (whole, name: string) => ENTITIES[name] ?? whole);
}

function fromCodePoint(code: number, fallback: string): string {
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : fallback;
}

/** URL encoding undone where it can be: %20 and + become spaces, %3F a question mark. */
function decodeUrl(text: string): string {
  return text.replace(/\+/g, ' ').replace(/(?:%[0-9a-fA-F]{2})+/g, (run) => {
    try {
      return decodeURIComponent(run);
    } catch {
      return run;
    }
  });
}

/** One case, one kind of apostrophe, one space wherever there was any run of white space. */
function flatten(text: string): string {
  return text.replace(/[‘’ʼ]/g, "'").replace(/\s+/g, ' ').toLowerCase();
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function offsetsOf(haystack: string, needle: string): number[] {
  const found: number[] = [];
  if (!needle) return found;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + 1)) found.push(i);
  return found;
}

function offsetsMatching(haystack: string, pattern: RegExp): number[] {
  return [...haystack.matchAll(pattern)].map((match) => match.index);
}

/**
 * Everything in a text that gives a locked tool away. An empty list is a clean file.
 */
export function findSpoilers(text: string, secrets: readonly Secret[], options: ScanOptions = {}): Finding[] {
  return scan(text, secrets, options, new Set());
}

function scan(text: string, secrets: readonly Secret[], options: ScanOptions, used: Set<Allowance>): Finding[] {
  const file = options.file ?? '';
  const kinds = options.kinds ?? DEFAULT_KINDS;
  const allow = options.allow ?? [];
  const decoded = decode(text);
  const flat = flatten(decoded);
  const flatUrl = flatten(decodeUrl(decoded));
  const findings: Finding[] = [];

  const report = (secret: Secret, kind: SpoilerKind, source: string, offsets: number[], length: number) => {
    for (const offset of offsets) {
      const around = source.slice(Math.max(0, offset - NEAR), offset + length + NEAR);
      const excuse = allow.find((a) => a.kind === kind && a.id === secret.id && (!a.file || a.file.test(file)) && around.includes(kind === 'name' || kind === 'id' ? a.context : a.context.toLowerCase()));
      if (excuse) used.add(excuse);
      else findings.push({ file, ref: secret.ref, kind, offset });
    }
  };

  for (const secret of secrets) {
    if (kinds.includes('address')) {
      const host = secret.host.toLowerCase();
      report(secret, 'address', flat, offsetsOf(flat, host), host.length);
    }
    if (kinds.includes('pitch')) {
      const pitch = flatten(secret.pitch);
      const plain = offsetsOf(flat, pitch);
      report(secret, 'pitch', flat, plain, pitch.length);
      if (!plain.length) report(secret, 'pitch', flatUrl, offsetsOf(flatUrl, pitch), pitch.length);
    }
    if (kinds.includes('name')) {
      const variants = new Set([secret.name, secret.name.toUpperCase()]);
      for (const name of variants) {
        const whole = new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(name)}(?![\\p{L}\\p{N}_])`, 'gu');
        report(secret, 'name', decoded, offsetsMatching(decoded, whole), name.length);
      }
    }
    if (kinds.includes('id')) {
      const id = escapeRegExp(secret.id);
      const quoted = new RegExp(`(["'\`])${id}\\1`, 'g');
      const inPath = new RegExp(`[/#]${id}(?=[/"'?#.\\s]|$)`, 'g');
      report(secret, 'id', decoded, [...offsetsMatching(decoded, quoted), ...offsetsMatching(decoded, inPath)], secret.id.length + 2);
    }
  }
  return findings.sort((a, b) => a.offset - b.offset);
}

const TEXT_FILE = /\.(html?|js|mjs|cjs|css|json|txt|xml|svg|webmanifest|map|md|csv)$/i;

/** Whether a built file is text. Anything else (pictures, fonts) is read byte by byte. */
export function isTextFile(path: string): boolean {
  const name = path.split('/').pop() ?? path;
  return TEXT_FILE.test(name) || name === '_headers' || name === '_redirects';
}

/**
 * A file's own path can be a hint too: "doors/dynasty.png". Finds any part of a path (between
 * slashes, dots, hyphens and underscores) that is a locked tool's id or name.
 */
export function findPathSpoilers(paths: readonly string[], secrets: readonly Secret[]): Finding[] {
  const findings: Finding[] = [];
  for (const path of paths) {
    const parts = new Set(path.toLowerCase().split(/[/._\-\s]+/));
    for (const secret of secrets) {
      if (parts.has(secret.id.toLowerCase()) || parts.has(secret.name.toLowerCase()) || path.toLowerCase().includes(secret.host.toLowerCase())) {
        findings.push({ file: path, ref: secret.ref, kind: 'path', offset: 0 });
      }
    }
  }
  return findings;
}

export interface BuiltFile {
  /** Its path inside the build, with forward slashes: "advent/index.html". */
  path: string;
  /** Its contents. Read binary files as latin1, so every byte is one character. */
  text: string;
}

export interface ScanResult {
  findings: Finding[];
  /** Allowances that matched nothing: out of date, so take them off the list. */
  unused: Allowance[];
}

/**
 * A whole build. Text files are searched for addresses, pitches and names; pictures and other
 * binary files for addresses and pitches only, since four random bytes can spell a short name;
 * and every path is checked as well.
 */
export function scanFiles(files: readonly BuiltFile[], secrets: readonly Secret[], allow: readonly Allowance[] = []): ScanResult {
  const used = new Set<Allowance>();
  const findings = findPathSpoilers(files.map((file) => file.path), secrets);
  for (const file of files) {
    const kinds: SpoilerKind[] = isTextFile(file.path) ? ['address', 'pitch', 'name'] : ['address', 'pitch'];
    findings.push(...scan(file.text, secrets, { file: file.path, kinds, allow }, used));
  }
  return { findings, unused: allow.filter((allowance) => !used.has(allowance)) };
}

/** A finding as a sentence that gives nothing away: "advent/index.html: the name behind door 6 is in this file (near character 10432)." */
export function describeFinding(finding: Finding): string {
  if (finding.kind === 'path') return `${finding.file}: the file's own path names what is behind ${finding.ref}.`;
  return `${finding.file || 'This text'}: the ${finding.kind} behind ${finding.ref} is in this file (near character ${finding.offset}).`;
}
