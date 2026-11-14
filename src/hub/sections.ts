/**
 * BUILD TIME ONLY: which sections of the nation profile the page may know about at a given
 * moment, from src/data/sections.json and the list of tools. The page gets the sections whose
 * tools have launched and nothing about the others; nation.ts, in the browser, counts the rest
 * without naming them.
 */
import type { LiveSection } from './nation.js';
import { hasLaunched, hostOf, type Tool } from './tools.js';

/** One line of src/data/sections.json. */
export interface SectionInfo {
  /** The key in the profile file. */
  section: string;
  /** What the page calls it: "Coat of arms". */
  label: string;
  /** The id of the tool that writes it. */
  tool: string;
  /** Shown even before its tool is live, without a link, because it gives nothing away. */
  always?: boolean;
}

/** BUILD TIME: the sections the page may show at this moment, in the file's order. */
export function liveSections(sections: readonly SectionInfo[], tools: readonly Tool[], at: Date): LiveSection[] {
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const live: LiveSection[] = [];
  for (const info of sections) {
    const tool = byId.get(info.tool);
    const launched = tool !== undefined && hasLaunched(tool, at);
    if (!launched && !info.always) continue;
    live.push({
      section: info.section,
      label: info.label,
      ...(launched ? { tool: { name: tool.name, url: tool.url, host: hostOf(tool) } } : {}),
    });
  }
  return live;
}

/** What is wrong with sections.json, as sentences; empty when it is sound. */
export function checkSections(sections: readonly unknown[], tools: readonly Tool[]): string[] {
  const problems: string[] = [];
  const ids = new Set(tools.map((tool) => tool.id));
  const seen = new Set<string>();
  sections.forEach((entry, i) => {
    const where = `Section ${i + 1}`;
    if (typeof entry !== 'object' || entry === null) {
      problems.push(`${where} isn't an object.`);
      return;
    }
    const info = entry as Record<string, unknown>;
    if (typeof info.section !== 'string' || !/^[a-z][a-zA-Z0-9]*$/.test(info.section)) problems.push(`${where} has no usable key.`);
    else if (info.section === 'meta') problems.push(`${where} is meta, which every profile has and no tool owns.`);
    else if (seen.has(info.section)) problems.push(`${where} repeats a key.`);
    else seen.add(info.section);
    if (typeof info.label !== 'string' || !info.label.trim()) problems.push(`${where} has no label.`);
    if (typeof info.tool !== 'string' || !ids.has(info.tool)) problems.push(`${where} is for a tool that isn't in the list of tools.`);
    if (info.always !== undefined && typeof info.always !== 'boolean') problems.push(`${where} has an "always" that isn't true or false.`);
  });
  return problems;
}
