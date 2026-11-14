/**
 * The advent calendar as a page may show it at a given moment.
 *
 * No cheating, no hints: a locked door is its number and its date and nothing else. The
 * LockedDoor type has no field for a name, a pitch or an address, so a page built from a
 * Calendar can't print one by accident, and nothing about a locked door can travel into the
 * props of a component. Which doors are open is decided by the moment the site is built,
 * never by the visitor's clock.
 */
import { dayAndMonth, dayKey, midnightOf, sameDay, shortDate, wallTime } from './brussels.js';
import { checkTools, doorTools, hasLaunched, hostOf, launchOf, type Tool } from './tools.js';

export interface LockedDoor {
  state: 'locked';
  door: number;
  /** "14 Dec" */
  date: string;
  /** The day it opens, as YYYY-MM-DD, for a <time> element. */
  day: string;
  /** "Opens 14 Dec" */
  label: string;
  /** For screen readers: "Door 5, opens 14 Dec". */
  aria: string;
}

export interface OpenDoor {
  state: 'open';
  door: number;
  date: string;
  day: string;
  /** Opened on the day the site was built: the ring and the words "Open today". */
  today: boolean;
  /** "Open" or "Open today" */
  label: string;
  name: string;
  pitch: string;
  /** "https://arms.eurth.org" */
  url: string;
  /** "arms.eurth.org" */
  host: string;
  /** For screen readers: "Door 4, open today: Cities. How big your cities should be". */
  aria: string;
}

export type Door = LockedDoor | OpenDoor;

/** 'before': every door locked. 'during': from the first door's day to the last door's day. 'after': all open, no door is today's. */
export type Season = 'before' | 'during' | 'after';

export interface Calendar {
  /** The year of the first door: 2026. */
  year: number;
  season: Season;
  doors: Door[];
  /** How many doors are open. */
  open: number;
  /** How many doors there are. */
  total: number;
  /** The number of today's door, when one opened on the day of the build. */
  today?: number;
  /** "10 December" */
  first: string;
  /** "24 December" */
  last: string;
}

/**
 * The calendar at a moment: the moment the site is built.
 * @param tools every tool, as in tools.json
 * @param at the build's moment
 */
export function calendarAt(tools: readonly Tool[], at: Date): Calendar {
  const behind = doorTools(tools);
  const first = behind[0];
  const last = behind[behind.length - 1];
  if (!first || !last) throw new Error('The calendar has no doors');

  const doors = behind.map((tool): Door => {
    const opens = launchOf(tool);
    const date = shortDate(opens);
    const day = dayKey(opens);
    if (!hasLaunched(tool, at)) {
      return { state: 'locked', door: tool.door, date, day, label: `Opens ${date}`, aria: `Door ${tool.door}, opens ${date}` };
    }
    const today = sameDay(opens, at);
    const label = today ? 'Open today' : 'Open';
    return {
      state: 'open',
      door: tool.door,
      date,
      day,
      today,
      label,
      name: tool.name,
      pitch: tool.pitch,
      url: tool.url,
      host: hostOf(tool),
      aria: `Door ${tool.door}, ${label.toLowerCase()}: ${tool.name}. ${tool.pitch}`,
    };
  });

  const open = doors.filter((door) => door.state === 'open').length;
  const todays = doors.find((door) => door.state === 'open' && door.today);
  const lastDay = dayKey(launchOf(last));
  const season: Season = open === 0 ? 'before' : dayKey(at) > lastDay ? 'after' : 'during';

  return {
    year: wallTime(launchOf(first)).year,
    season,
    doors,
    open,
    total: doors.length,
    ...(todays ? { today: todays.door } : {}),
    first: dayAndMonth(launchOf(first)),
    last: dayAndMonth(launchOf(last)),
  };
}

/**
 * What is wrong with the calendar's schedule, as sentences; empty when it is sound: doors
 * numbered from 1 without gaps, one a day on consecutive days, each at 00:00 in Brussels, each
 * a tool. Problems name doors by number only.
 * @param expected how many doors there should be (15 in 2026)
 */
export function checkSchedule(tools: readonly Tool[], expected?: number): string[] {
  const problems = checkTools(tools);
  if (problems.length) return problems;

  const behind = doorTools(tools);
  if (!behind.length) return ['The calendar has no doors.'];
  if (expected !== undefined && behind.length !== expected) problems.push(`The calendar has ${behind.length} doors, not ${expected}.`);

  let previous: string | undefined;
  behind.forEach((tool, i) => {
    if (tool.door !== i + 1) problems.push(`Door ${tool.door} is out of sequence: the doors should run from 1 without gaps or repeats.`);
    if (tool.kind !== 'tool') problems.push(`Door ${tool.door} isn't a tool.`);
    const opens = launchOf(tool);
    const day = dayKey(opens);
    if (midnightOf(day).getTime() !== opens.getTime()) problems.push(`Door ${tool.door} doesn't open at 00:00 in Brussels.`);
    if (previous !== undefined && dayKey(new Date(midnightOf(previous).getTime() + 36 * 3_600_000)) !== day) {
      problems.push(`Door ${tool.door} doesn't open the day after door ${tool.door - 1}.`);
    }
    previous = day;
  });
  return problems;
}
