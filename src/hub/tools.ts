/**
 * The list of Eurth's tools, as @eurth/style's tools.json holds it, and what has launched at a
 * given moment. BUILD TIME ONLY: the full list names tools whose doors are still closed, so
 * nothing that ends up in the browser may import this with real data. Pages are handed the
 * views that doors.ts, live.ts, changelog.ts and nation.ts make from it, and nothing else.
 */

export type ToolKind = 'tool' | 'hub' | 'site';

export interface Tool {
  /** Its subdomain, and its key everywhere: 'flag' for flag.eurth.org. */
  id: string;
  /** 'tool': one of the suite. 'hub': tools.eurth.org itself. 'site': the rest of Eurth. */
  kind: ToolKind;
  name: string;
  /** "https://flag.eurth.org", no slash at the end. */
  url: string;
  /** One line, no full stop. */
  pitch: string;
  /** ISO time with its offset: the moment it goes live. */
  launch: string;
  /** Its door in the advent calendar, if it has one. */
  door?: number;
}

/** The moment a tool goes live. */
export function launchOf(tool: Tool): Date {
  const at = new Date(tool.launch);
  if (Number.isNaN(at.getTime())) throw new Error(`"${tool.id}" has a launch that isn't a time`);
  return at;
}

/** "flag.eurth.org" */
export function hostOf(tool: Pick<Tool, 'url'>): string {
  return new URL(tool.url).host;
}

export function hasLaunched(tool: Tool, at: Date): boolean {
  return launchOf(tool).getTime() <= at.getTime();
}

/** Launched at this moment, in the list's order. */
export function launchedTools(tools: readonly Tool[], at: Date): Tool[] {
  return tools.filter((tool) => hasLaunched(tool, at));
}

/** Not launched yet: what no page may mention. */
export function lockedTools(tools: readonly Tool[], at: Date): Tool[] {
  return tools.filter((tool) => !hasLaunched(tool, at));
}

/** The tools behind the calendar's doors, by door number. */
export function doorTools(tools: readonly Tool[]): (Tool & { door: number })[] {
  return tools.filter((tool): tool is Tool & { door: number } => typeof tool.door === 'number').sort((a, b) => a.door - b.door);
}

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;

/**
 * What is wrong with a list of tools, as sentences; empty when it is sound. Problems name tools
 * by their place in the list, never by name, so the message itself gives nothing away.
 */
export function checkTools(tools: readonly unknown[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  const hosts = new Set<string>();
  tools.forEach((entry, i) => {
    const where = `Entry ${i + 1}`;
    if (typeof entry !== 'object' || entry === null) {
      problems.push(`${where} isn't an object.`);
      return;
    }
    const tool = entry as Record<string, unknown>;
    for (const key of ['id', 'name', 'url', 'pitch', 'launch']) {
      if (typeof tool[key] !== 'string' || !(tool[key] as string).trim()) problems.push(`${where} has no ${key}.`);
    }
    if (!['tool', 'hub', 'site'].includes(tool.kind as string)) problems.push(`${where} has a kind that isn't tool, hub or site.`);
    if (typeof tool.id === 'string') {
      if (!/^[a-z][a-z0-9-]*$/.test(tool.id)) problems.push(`${where} has an id that isn't a plain subdomain.`);
      if (ids.has(tool.id)) problems.push(`${where} repeats an id.`);
      ids.add(tool.id);
    }
    if (typeof tool.url === 'string') {
      let url: URL | undefined;
      try {
        url = new URL(tool.url);
      } catch {
        problems.push(`${where} has an address that isn't a URL.`);
      }
      if (url) {
        if (url.protocol !== 'https:' || url.pathname !== '/' || tool.url.endsWith('/') || url.search || url.hash) problems.push(`${where} should have an address like https://flag.eurth.org.`);
        if (url.host !== 'eurth.org' && !url.host.endsWith('.eurth.org')) problems.push(`${where} isn't on eurth.org.`);
        if (hosts.has(url.host)) problems.push(`${where} repeats an address.`);
        hosts.add(url.host);
      }
    }
    if (typeof tool.pitch === 'string' && /[.!]$/.test(tool.pitch.trim())) problems.push(`${where} has a pitch that ends in a full stop.`);
    if (typeof tool.launch === 'string' && (!ISO_WITH_OFFSET.test(tool.launch) || Number.isNaN(new Date(tool.launch).getTime()))) {
      problems.push(`${where} has a launch that isn't an ISO time with its offset.`);
    }
    if (tool.door !== undefined && (!Number.isInteger(tool.door) || (tool.door as number) < 1)) problems.push(`${where} has a door that isn't a whole number from 1.`);
  });
  return problems;
}
