/**
 * BUILD TIME ONLY: the hub as this build may show it. Pages import this in their frontmatter and
 * print from what it returns; nothing in src/pages or src/components reads tools.json, the
 * changelog file or the sections file itself.
 *
 * "Now" is the build's moment: EURTH_BUILD_TIME when the nightly run builds for the coming
 * midnight, otherwise the clock of the machine that builds. Never the visitor's clock.
 */
import { buildTime, everyTool, githubLinksAllowed } from '@eurth/style/build';
import changelog from '../data/changelog.json';
import sections from '../data/sections.json';
import type { Release } from './changelog.js';
import { hubAt, type Hub, type HubData } from './index.js';
import type { SectionInfo } from './sections.js';
import type { Tool } from './tools.js';

/** The three data files the hub is made from. */
export function hubData(): HubData {
  return { tools: everyTool() as Tool[], releases: changelog.releases as Release[], sections: sections.sections as SectionInfo[] };
}

export interface HubNow extends Hub {
  /** Whether pages may link to GitHub yet (from 25 December 2026). */
  github: boolean;
}

export function hubNow(): HubNow {
  const at = buildTime();
  const hub = hubAt(hubData(), at);
  if (hub.heldReleases) console.info(`[hub] ${hub.heldReleases} changelog entries are held back until their day comes.`);
  return { ...hub, github: githubLinksAllowed(at) };
}
