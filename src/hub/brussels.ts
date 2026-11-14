/**
 * Days and midnights in Europe/Brussels, whatever time zone the machine is in. The advent
 * calendar's doors open at 00:00 Brussels time, the build server runs on UTC, and the two
 * differ by an hour in winter and two in summer, so nothing here trusts the local clock's zone.
 */

const ZONE = 'Europe/Brussels';

const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

// Written out, because en-GB shortens September to "Sept" and the doors say "14 Dec".
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** What the clocks in Brussels show at a moment. */
export interface WallTime {
  year: number;
  /** 1 to 12. */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const two = (n: number) => String(n).padStart(2, '0');

function mustBeTime(at: Date): void {
  if (!(at instanceof Date) || Number.isNaN(at.getTime())) throw new Error('Not a moment in time');
}

/** What the clocks in Brussels show at this moment. */
export function wallTime(at: Date): WallTime {
  mustBeTime(at);
  const found: Record<string, number> = {};
  for (const part of PARTS.formatToParts(at)) {
    if (part.type !== 'literal') found[part.type] = Number(part.value);
  }
  return {
    year: found.year ?? 0,
    month: found.month ?? 0,
    day: found.day ?? 0,
    hour: found.hour ?? 0,
    minute: found.minute ?? 0,
    second: found.second ?? 0,
  };
}

/** How far Brussels is ahead of UTC at this moment, in minutes: 60 in winter, 120 in summer. */
export function offsetMinutes(at: Date): number {
  const wall = wallTime(at);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const whole = Math.floor(at.getTime() / 1000) * 1000;
  return Math.round((asUtc - whole) / 60_000);
}

/**
 * The moment a Brussels day begins: 00:00 on that date. A day past the end of the month rolls
 * over, so midnight(2026, 12, 32) is New Year's Day.
 */
export function midnight(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day);
  // The offset at the guess is right except within hours of a clock change; a second pass settles it.
  let moment = guess - offsetMinutes(new Date(guess)) * 60_000;
  moment = guess - offsetMinutes(new Date(moment)) * 60_000;
  return new Date(moment);
}

/** The Brussels day a moment falls on, as YYYY-MM-DD. Days compare correctly as text. */
export function dayKey(at: Date): string {
  const wall = wallTime(at);
  return `${String(wall.year).padStart(4, '0')}-${two(wall.month)}-${two(wall.day)}`;
}

/** Whether two moments fall on the same Brussels day. */
export function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** "14 Dec": the Brussels day, short, for a door. */
export function shortDate(at: Date): string {
  const wall = wallTime(at);
  return `${wall.day} ${MONTHS_SHORT[wall.month - 1]}`;
}

/** "14 December": the Brussels day without its year. */
export function dayAndMonth(at: Date): string {
  const wall = wallTime(at);
  return `${wall.day} ${MONTHS[wall.month - 1]}`;
}

/** "14 December 2026": the Brussels day in full. */
export function longDate(at: Date): string {
  return `${dayAndMonth(at)} ${wallTime(at).year}`;
}

/** A moment as Brussels writes it, with its offset: "2026-12-10T00:00:00+01:00". */
export function isoWithOffset(at: Date): string {
  const wall = wallTime(at);
  const offset = offsetMinutes(at);
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  return `${dayKey(at)}T${two(wall.hour)}:${two(wall.minute)}:${two(wall.second)}${sign}${two(Math.floor(abs / 60))}:${two(abs % 60)}`;
}

/** The start of a day given as YYYY-MM-DD, in Brussels. */
export function midnightOf(day: string): Date {
  const found = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!found) throw new Error(`Not a day (YYYY-MM-DD): ${day}`);
  const [year, month, date] = [Number(found[1]), Number(found[2]), Number(found[3])];
  const start = midnight(year, month, date);
  if (dayKey(start) !== day) throw new Error(`No such day: ${day}`);
  return start;
}
