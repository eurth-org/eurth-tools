/**
 * Everything the hub's pages may show at the build's moment, in one call. BUILD TIME ONLY.
 *
 * Pages take what they print from here and from nowhere else: never from tools.json, the
 * changelog file or the sections file directly. What comes out of hubAt() holds nothing about a
 * tool whose door is closed, and the tests check that for every day of advent.
 */
import { changelogAt, type Release, type ShownRelease } from './changelog.js';
import { calendarAt, type Calendar } from './doors.js';
import { liveTool, liveTools, type LiveTool } from './live.js';
import type { LiveSection } from './nation.js';
import { liveSections, type SectionInfo } from './sections.js';
import type { Tool } from './tools.js';

export interface HubData {
  tools: readonly Tool[];
  releases: readonly Release[];
  sections: readonly SectionInfo[];
}

export interface Hub {
  /** The build's moment, as an ISO time. */
  builtFor: string;
  calendar: Calendar;
  /** "Already live". */
  live: LiveTool[];
  /** The changelog page, newest first. */
  releases: ShownRelease[];
  /** How many releases in the file this build leaves out: for a line in the build log. */
  heldReleases: number;
  /** The profile sections "Your nation" may know about. */
  sections: LiveSection[];
  /** Where "Open the card" leads, once that tool is live. */
  card?: LiveTool;
}

/** The id of the tool that shows a whole profile on one page. */
const CARD = 'card';

export function hubAt(data: HubData, at: Date): Hub {
  const changelog = changelogAt(data.releases, data.tools, at);
  const card = liveTool(data.tools, at, CARD);
  return {
    builtFor: at.toISOString(),
    calendar: calendarAt(data.tools, at),
    live: liveTools(data.tools, at),
    releases: changelog.shown,
    heldReleases: changelog.held.length,
    sections: liveSections(data.sections, data.tools, at),
    ...(card ? { card } : {}),
  };
}
