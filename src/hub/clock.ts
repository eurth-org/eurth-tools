/**
 * The nightly rebuild's clock. The workflow starts at 22:30 UTC (23:30 in Brussels in winter),
 * builds the site as it should be at midnight, waits for midnight and deploys. GitHub can start
 * a scheduled run late, and the run can be started by hand at any hour, so the plan is worked
 * out from the moment the run actually begins.
 */
import { dayKey, isoWithOffset, midnight, midnightOf, wallTime } from './brussels.js';

const HOUR = 3_600_000;

/** The next 00:00 in Brussels strictly after this moment. */
export function nextMidnight(now: Date): Date {
  const wall = wallTime(now);
  return midnight(wall.year, wall.month, wall.day + 1);
}

export interface DeployPlan {
  /** 'midnight': build for the coming midnight, wait, deploy. 'now': build for this moment and deploy at once. */
  mode: 'midnight' | 'now';
  /** The moment the build counts as "now" (EURTH_BUILD_TIME), as Brussels writes it with its offset. */
  buildTime: string;
  /** How long to wait between building and deploying, in milliseconds. */
  waitMs: number;
  /** The Brussels day the deployed site is for, as YYYY-MM-DD. */
  day: string;
}

/**
 * What a run that starts now should do. Within the window before midnight (two hours unless
 * told otherwise) it builds for midnight and waits; at any other time (a late start, a run by
 * hand, a push in the afternoon) it builds for now and deploys at once. It never waits longer
 * than the window.
 */
export function planDeploy(now: Date, windowMs: number = 2 * HOUR): DeployPlan {
  const next = nextMidnight(now);
  const wait = next.getTime() - now.getTime();
  if (wait <= windowMs) {
    return { mode: 'midnight', buildTime: isoWithOffset(next), waitMs: wait, day: dayKey(next) };
  }
  return { mode: 'now', buildTime: isoWithOffset(now), waitMs: 0, day: dayKey(now) };
}

/** How long is left until the plan's build time, from a later moment: never less than nothing. */
export function remainingWait(plan: DeployPlan, now: Date): number {
  return Math.max(0, new Date(plan.buildTime).getTime() - now.getTime());
}

/**
 * The midnight of every Brussels day from one day to another, both included, as ISO times with
 * their offsets: the build times the no-hints test builds the site for.
 * @param from YYYY-MM-DD
 * @param to YYYY-MM-DD
 */
export function midnightsBetween(from: string, to: string): string[] {
  const end = midnightOf(to).getTime();
  const found: string[] = [];
  let at = midnightOf(from);
  if (at.getTime() > end) throw new Error(`${from} is after ${to}`);
  while (at.getTime() <= end) {
    found.push(isoWithOffset(at));
    const wall = wallTime(at);
    at = midnight(wall.year, wall.month, wall.day + 1);
  }
  return found;
}
