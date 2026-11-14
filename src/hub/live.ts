/**
 * "Already live": every tool and site that has launched at the build's moment, except the hub
 * itself, in the list's own order. An advent tool joins the day its door opens.
 */
import { dayKey, longDate } from './brussels.js';
import { hasLaunched, hostOf, launchOf, type Tool } from './tools.js';

export interface LiveTool {
  id: string;
  kind: 'tool' | 'site';
  name: string;
  pitch: string;
  url: string;
  host: string;
  /** The day it went live, as YYYY-MM-DD. */
  since: string;
  /** "12 November 2026" */
  sinceLabel: string;
  /** Its door in the advent calendar, if it came through one. */
  door?: number;
}

export function liveTools(tools: readonly Tool[], at: Date): LiveTool[] {
  return tools
    .filter((tool) => tool.kind !== 'hub' && hasLaunched(tool, at))
    .map((tool) => {
      const launch = launchOf(tool);
      return {
        id: tool.id,
        kind: tool.kind as 'tool' | 'site',
        name: tool.name,
        pitch: tool.pitch,
        url: tool.url,
        host: hostOf(tool),
        since: dayKey(launch),
        sinceLabel: longDate(launch),
        ...(tool.door !== undefined ? { door: tool.door } : {}),
      };
    });
}

/** One live tool by its id, or nothing if it hasn't launched (or doesn't exist): for "Open the card". */
export function liveTool(tools: readonly Tool[], at: Date, id: string): LiveTool | undefined {
  return liveTools(tools, at).find((tool) => tool.id === id);
}
