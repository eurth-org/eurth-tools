/**
 * The changelog page: every release of every live tool, newest first, from src/data/changelog.json.
 *
 * The file is written ahead of time, so it can hold releases of tools whose doors are still
 * closed. A release is shown only when its tool has launched and its own day has come, and it
 * is held back while its words mention a tool that is still locked. BUILD TIME ONLY.
 */
import { dayKey, longDate, midnightOf } from './brussels.js';
import { findSpoilers, secretsAt } from './spoilers.js';
import { hasLaunched, hostOf, type Tool } from './tools.js';

/** One release, as the data file holds it. */
export interface Release {
  /** The tool's id in tools.json: "flag". */
  tool: string;
  /** The Brussels day of the release: YYYY-MM-DD. */
  date: string;
  /** The time of day, HH:MM, where it is known. Not used for ordering: the file's order is. */
  time?: string;
  /** "0.1.0", where the tool numbers its releases. */
  version?: string;
  /** A short line, sentence case, no full stop. */
  title: string;
  /** What it added, a sentence each. */
  notes: string[];
}

export interface ShownRelease {
  /** An anchor for the page: "flag-2026-11-12". */
  anchor: string;
  tool: { id: string; name: string; url: string; host: string };
  date: string;
  /** "12 November 2026" */
  dateLabel: string;
  version?: string;
  title: string;
  notes: string[];
}

/** Why a release isn't shown yet. None of these names a tool. */
export type HeldReason = 'its tool has not launched' | 'its day has not come' | 'it mentions a locked tool';

export interface Changelog {
  shown: ShownRelease[];
  /** Releases in the file that this build leaves out, by their place in the file. */
  held: { entry: number; reason: HeldReason }[];
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * What is wrong with the changelog file, as sentences; empty when it is sound. Entries are
 * named by their place in the file.
 */
export function checkChangelog(releases: readonly unknown[], tools: readonly Tool[]): string[] {
  const problems: string[] = [];
  const ids = new Set(tools.map((tool) => tool.id));
  releases.forEach((entry, i) => {
    const where = `Release ${i + 1}`;
    if (typeof entry !== 'object' || entry === null) {
      problems.push(`${where} isn't an object.`);
      return;
    }
    const release = entry as Record<string, unknown>;
    if (typeof release.tool !== 'string' || !ids.has(release.tool)) problems.push(`${where} is for a tool that isn't in the list of tools.`);
    if (typeof release.date !== 'string' || !DAY.test(release.date)) problems.push(`${where} has a date that isn't YYYY-MM-DD.`);
    else {
      try {
        midnightOf(release.date);
      } catch {
        problems.push(`${where} has a date that doesn't exist.`);
      }
    }
    if (release.time !== undefined && (typeof release.time !== 'string' || !TIME.test(release.time))) problems.push(`${where} has a time that isn't HH:MM.`);
    if (release.version !== undefined && (typeof release.version !== 'string' || !release.version.trim())) problems.push(`${where} has an empty version.`);
    if (typeof release.title !== 'string' || !release.title.trim()) problems.push(`${where} has no title.`);
    else if (/[.!]$/.test(release.title.trim())) problems.push(`${where} has a title that ends in a full stop.`);
    if (!Array.isArray(release.notes) || !release.notes.length || release.notes.some((note) => typeof note !== 'string' || !note.trim())) {
      problems.push(`${where} needs at least one note, each a sentence.`);
    }
  });
  return problems;
}

/** The changelog at the build's moment: newest day first; releases of one day in the file's order, which keeps the newest on top. */
export function changelogAt(releases: readonly Release[], tools: readonly Tool[], at: Date): Changelog {
  const today = dayKey(at);
  const secrets = secretsAt(tools, at);
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const held: Changelog['held'] = [];
  const kept: { release: Release; tool: Tool; entry: number }[] = [];

  releases.forEach((release, i) => {
    const tool = byId.get(release.tool);
    const entry = i + 1;
    if (!tool || !hasLaunched(tool, at)) held.push({ entry, reason: 'its tool has not launched' });
    else if (release.date > today) held.push({ entry, reason: 'its day has not come' });
    else if (findSpoilers([release.title, release.version ?? '', ...release.notes].join('\n'), secrets).length) held.push({ entry, reason: 'it mentions a locked tool' });
    else kept.push({ release, tool, entry });
  });

  kept.sort((a, b) => b.release.date.localeCompare(a.release.date) || a.entry - b.entry);

  const anchors = new Map<string, number>();
  const shown = kept.map(({ release, tool }): ShownRelease => {
    const base = `${tool.id}-${release.date}`;
    const count = (anchors.get(base) ?? 0) + 1;
    anchors.set(base, count);
    return {
      anchor: count === 1 ? base : `${base}-${count}`,
      tool: { id: tool.id, name: tool.name, url: tool.url, host: hostOf(tool) },
      date: release.date,
      dateLabel: longDate(midnightOf(release.date)),
      ...(release.version ? { version: release.version } : {}),
      title: release.title,
      notes: [...release.notes],
    };
  });
  return { shown, held };
}
