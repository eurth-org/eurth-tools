import catalogue from './fixtures/tools.json' with { type: 'json' };
import type { Tool } from '../src/hub/tools.js';

/** A snapshot of @eurth/style's tools.json, until the hub can read the real one at build time. */
export const TOOLS = catalogue.tools as Tool[];

/** A moment from Brussels wall time in December 2026 (UTC+1): at(13, 9, 30) is 13 December, 09:30. */
export function at(day: number, hour = 0, minute = 0, second = 0): Date {
  const two = (n: number) => String(n).padStart(2, '0');
  return new Date(`2026-12-${two(day)}T${two(hour)}:${two(minute)}:${two(second)}+01:00`);
}

/** Everything a view holds, as one text: for checking that nothing about a locked tool is in it. */
export function everythingIn(value: unknown): string {
  return JSON.stringify(value);
}

/** One tool of the snapshot by its id. */
export function findTool(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
