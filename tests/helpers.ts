import { everyTool } from '@eurth/style/build';
import type { Tool } from '../src/hub/tools.js';

/** Every tool, as @eurth/style's tools.json has it: the list the site itself is built from. */
export const TOOLS = everyTool() as Tool[];

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
