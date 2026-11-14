/**
 * "Your nation": read a nation profile file (<nation>.eurth.json) that someone picks or drops,
 * and say which sections are filled, each with a link to its tool where that tool is live.
 * Nothing leaves the device and nothing is stored: the file is read, shown and forgotten.
 *
 * This module runs IN THE BROWSER and imports nothing. It knows of no section the build didn't
 * hand over (sections.ts does that, at build time): a filled section for a tool whose door is
 * still closed is counted and never named.
 *
 * That is also why the hub doesn't bundle @eurth/profile: its schema names every section, and
 * most sections are named after tools whose doors are closed. This reader needs no schema. It
 * treats the file as someone else's input: capped in size, read as data, shown as plain text.
 */
/** A section the page may know about, as the build hands it over. */
export interface LiveSection {
  section: string;
  label: string;
  /** The tool that writes it, when that tool is live. */
  tool?: { name: string; url: string; host: string };
}

/** The largest profile file a tool will read: 2 MB, as @eurth/profile has it. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
/** The profile format this page knows. */
export const SCHEMA_VERSION = 1;
const MAX_NAME = 80;
const MAX_SUMMARY = 600;
const MAX_LINK = 4000;

export interface FilledSection {
  section: string;
  label: string;
  /** Where to open it: the section's own link when it leads to its tool, otherwise the tool's start. Absent while the tool isn't live. */
  href?: string;
  /** The tool's name, for "Open in Flagwright". */
  toolName?: string;
  /** The section's one-paragraph summary, as plain text. */
  summary?: string;
}

export interface EmptySection {
  section: string;
  label: string;
  /** The tool's start, to make one. */
  href?: string;
  toolName?: string;
}

export interface Nation {
  /** The nation's name, or an empty string when the file gives none. */
  name: string;
  /** The sections this page knows that hold something, in the page's order. */
  filled: FilledSection[];
  /** The sections this page knows that are still empty. */
  empty: EmptySection[];
  /** How many more sections hold something but can't be named here yet. */
  more: number;
}

export type ReadResult = { ok: true; nation: Nation } | { ok: false; message: string };

const NOT_A_PROFILE = "That file isn't a nation profile. Pick one that ends in .eurth.json.";

/** Plain text, without control characters, cut to a length. */
function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  const text = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Whether a value says anything: text that isn't blank, a number, a list or an object with something in it. */
function saysSomething(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some(saysSomething);
  if (isObject(value)) return Object.values(value).some(saysSomething);
  return false;
}

/** Whether a section holds anything besides the date it was last written. */
export function isFilled(section: unknown): boolean {
  if (!isObject(section)) return false;
  return Object.entries(section).some(([key, value]) => key !== 'updated' && saysSomething(value));
}

/** A section's link, if it is https and leads to its own tool; otherwise nothing. */
function ownLink(link: unknown, host: string): string | undefined {
  if (typeof link !== 'string' || link.length > MAX_LINK) return undefined;
  try {
    const url = new URL(link);
    return url.protocol === 'https:' && url.host === host && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/**
 * IN THE BROWSER: read the text of a profile file against the sections the build handed over.
 * Never throws; a file that can't be used comes back with a sentence for the person.
 */
export function readProfile(text: string, live: readonly LiveSection[]): ReadResult {
  if (text.length > MAX_FILE_BYTES || new TextEncoder().encode(text).length > MAX_FILE_BYTES) {
    return { ok: false, message: 'That file is larger than 2 MB, which is more than a nation profile can be.' };
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, message: NOT_A_PROFILE };
  }
  if (!isObject(data) || !isObject(data.meta)) return { ok: false, message: NOT_A_PROFILE };
  const schema = data.meta.schema;
  if (typeof schema !== 'number' || !Number.isInteger(schema) || schema < 1) return { ok: false, message: NOT_A_PROFILE };
  if (schema > SCHEMA_VERSION) {
    return { ok: false, message: 'That profile was saved in a newer format than this page knows. Reload the page and try again.' };
  }

  const known = new Set<string>(['meta']);
  const filled: FilledSection[] = [];
  const empty: EmptySection[] = [];
  for (const { section, label, tool } of live) {
    known.add(section);
    const value = Object.hasOwn(data, section) ? data[section] : undefined;
    if (!isFilled(value)) {
      empty.push({ section, label, ...(tool ? { href: tool.url, toolName: tool.name } : {}) });
      continue;
    }
    const body = value as Record<string, unknown>;
    const summary = clean(body.summary, MAX_SUMMARY);
    filled.push({
      section,
      label,
      ...(tool ? { href: ownLink(body.link, tool.host) ?? tool.url, toolName: tool.name } : {}),
      ...(summary ? { summary } : {}),
    });
  }
  const more = Object.keys(data).filter((key) => !known.has(key) && isFilled(data[key])).length;
  return { ok: true, nation: { name: clean(data.meta.nation, MAX_NAME), filled, empty, more } };
}

/** Whether a picked or dropped file is worth reading at all, before reading it. */
export function checkFile(file: { name: string; size: number }): string | undefined {
  if (file.size > MAX_FILE_BYTES) return 'That file is larger than 2 MB, which is more than a nation profile can be.';
  if (file.size === 0) return 'That file is empty.';
  if (!/\.json$/i.test(file.name)) return NOT_A_PROFILE;
  return undefined;
}

/**
 * The line under the list for sections that hold something but can't be named here.
 * @param allOpen every door of the calendar is open, so what is left over is from a tool newer than this page
 */
export function moreLine(more: number, allOpen: boolean): string {
  if (more <= 0) return '';
  const sections = more === 1 ? '1 more section' : `${more} more sections`;
  if (allOpen) return `And ${sections} from ${more === 1 ? 'a tool' : 'tools'} this page doesn't know yet.`;
  return `And ${sections}, for ${more === 1 ? "a door that hasn't" : "doors that haven't"} opened yet.`;
}

/** The result in a sentence or two, for screen readers and for copying. */
export function describeNation(nation: Nation, allOpen: boolean): string {
  const who = nation.name || 'This nation';
  const total = nation.filled.length + nation.empty.length;
  const parts: string[] = [];
  if (!nation.filled.length) parts.push(`${who} has none of ${total} sections filled yet.`);
  else parts.push(`${who} has ${nation.filled.length} of ${total} sections filled: ${list(nation.filled.map((s) => s.label))}.`);
  if (nation.filled.length && nation.empty.length) parts.push(`Still to do: ${list(nation.empty.map((s) => s.label))}.`);
  const more = moreLine(nation.more, allOpen);
  if (more) parts.push(more);
  return parts.join(' ');
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
