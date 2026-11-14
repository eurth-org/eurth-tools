import { describe, expect, it } from 'vitest';
import { midnightsBetween, nextMidnight, planDeploy, remainingWait } from '../src/hub/clock.js';
import { calendarAt } from '../src/hub/doors.js';
import { liveTool, liveTools } from '../src/hub/live.js';
import { at, TOOLS } from './helpers.js';

describe('already live', () => {
  it('today is Map, Newsroom, Governmint and Flagwright', () => {
    const live = liveTools(TOOLS, new Date('2026-11-14T12:00:00+01:00'));
    expect(live.map((tool) => tool.name)).toEqual(['Map', 'Newsroom', 'Governmint', 'Flagwright']);
    expect(live[3]).toEqual({
      id: 'flag',
      kind: 'tool',
      name: 'Flagwright',
      pitch: 'Flags made to fly',
      url: 'https://flag.eurth.org',
      host: 'flag.eurth.org',
      since: '2026-11-12',
      sinceLabel: '12 November 2026',
    });
  });

  it('never lists the hub itself', () => {
    expect(liveTools(TOOLS, at(9)).map((tool) => tool.id)).toEqual(['map', 'news', 'gov', 'flag']);
    expect(liveTools(TOOLS, at(25)).some((tool) => tool.id === 'tools')).toBe(false);
  });

  it('gains each advent tool the day its door opens', () => {
    expect(liveTools(TOOLS, at(10)).map((tool) => tool.name)).toEqual(['Map', 'Newsroom', 'Governmint', 'Flagwright', 'Arms']);
    expect(liveTools(TOOLS, at(13)).slice(4).map((tool) => [tool.name, tool.door])).toEqual([['Arms', 1], ['Seats', 2], ['Names', 3], ['Cities', 4]]);
    expect(liveTools(TOOLS, at(25))).toHaveLength(19);
  });

  it('agrees with the calendar on every day', () => {
    for (let day = 9; day <= 25; day++) {
      expect(liveTools(TOOLS, at(day)).filter((tool) => tool.door !== undefined)).toHaveLength(calendarAt(TOOLS, at(day)).open);
    }
  });

  it('finds Card only once Card is live', () => {
    expect(liveTool(TOOLS, at(23, 23, 59), 'card')).toBeUndefined();
    expect(liveTool(TOOLS, at(24), 'card')?.url).toBe('https://card.eurth.org');
    expect(liveTool(TOOLS, at(25), 'nothing')).toBeUndefined();
  });
});

describe('the nightly clock', () => {
  it('finds the next midnight in Brussels', () => {
    expect(nextMidnight(new Date('2026-12-09T22:30:00Z')).toISOString()).toBe('2026-12-09T23:00:00.000Z');
    expect(nextMidnight(new Date('2026-12-09T23:00:00Z')).toISOString()).toBe('2026-12-10T23:00:00.000Z');
    expect(nextMidnight(new Date('2026-12-31T22:59:59Z')).toISOString()).toBe('2026-12-31T23:00:00.000Z');
    expect(nextMidnight(new Date('2026-06-30T21:30:00Z')).toISOString()).toBe('2026-06-30T22:00:00.000Z');
  });

  it('at 22:30 UTC builds for midnight and waits half an hour', () => {
    expect(planDeploy(new Date('2026-12-09T22:30:00Z'))).toEqual({ mode: 'midnight', buildTime: '2026-12-10T00:00:00+01:00', waitMs: 30 * 60_000, day: '2026-12-10' });
  });

  it('when GitHub starts the run late but before midnight, still builds for midnight', () => {
    expect(planDeploy(new Date('2026-12-09T22:58:20Z'))).toEqual({ mode: 'midnight', buildTime: '2026-12-10T00:00:00+01:00', waitMs: 100_000, day: '2026-12-10' });
  });

  it('when the run starts after midnight, builds for now and deploys at once', () => {
    const plan = planDeploy(new Date('2026-12-09T23:07:00Z'));
    expect(plan).toEqual({ mode: 'now', buildTime: '2026-12-10T00:07:00+01:00', waitMs: 0, day: '2026-12-10' });
    expect(calendarAt(TOOLS, new Date(plan.buildTime)).today).toBe(1);
  });

  it('when run by hand in the afternoon, builds for now and opens nothing early', () => {
    const plan = planDeploy(new Date('2026-12-13T14:00:00Z'));
    expect(plan.mode).toBe('now');
    expect(plan.waitMs).toBe(0);
    expect(calendarAt(TOOLS, new Date(plan.buildTime)).open).toBe(4);
  });

  it('never waits longer than its window', () => {
    for (let minutes = 0; minutes < 24 * 60; minutes += 7) {
      const plan = planDeploy(new Date(Date.UTC(2026, 11, 12, 0, minutes)));
      expect(plan.waitMs).toBeLessThanOrEqual(2 * 3_600_000);
      if (plan.mode === 'now') expect(plan.waitMs).toBe(0);
    }
    expect(planDeploy(new Date('2026-12-09T21:00:00Z')).mode).toBe('midnight');
    expect(planDeploy(new Date('2026-12-09T20:59:59Z')).mode).toBe('now');
    expect(planDeploy(new Date('2026-12-09T22:30:00Z'), 10 * 60_000).mode).toBe('now');
  });

  it('builds exactly the next door\'s site on each scheduled evening, 8 to 24 December', () => {
    for (let evening = 8; evening <= 24; evening++) {
      const plan = planDeploy(new Date(Date.UTC(2026, 11, evening, 22, 30)));
      expect(plan.mode).toBe('midnight');
      expect(plan.day).toBe(`2026-12-${String(evening + 1).padStart(2, '0')}`);
      expect(calendarAt(TOOLS, new Date(plan.buildTime)).open).toBe(Math.max(0, Math.min(15, evening - 8)));
    }
  });

  it('counts down what is left of the wait', () => {
    const plan = planDeploy(new Date('2026-12-09T22:30:00Z'));
    expect(remainingWait(plan, new Date('2026-12-09T22:41:00Z'))).toBe(19 * 60_000);
    expect(remainingWait(plan, new Date('2026-12-09T23:00:05Z'))).toBe(0);
  });

  it('lists the midnights the no-hints test builds for: 9 to 25 December', () => {
    const days = midnightsBetween('2026-12-09', '2026-12-25');
    expect(days).toHaveLength(17);
    expect(days[0]).toBe('2026-12-09T00:00:00+01:00');
    expect(days[16]).toBe('2026-12-25T00:00:00+01:00');
    expect(days.map((day) => calendarAt(TOOLS, new Date(day)).open)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15]);
    expect(() => midnightsBetween('2026-12-25', '2026-12-09')).toThrow();
  });

  it('lists midnights across a clock change', () => {
    expect(midnightsBetween('2026-10-24', '2026-10-26')).toEqual(['2026-10-24T00:00:00+02:00', '2026-10-25T00:00:00+02:00', '2026-10-26T00:00:00+01:00']);
  });
});
