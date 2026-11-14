import { describe, expect, it } from 'vitest';
import { calendarAt, checkSchedule, type Door, type LockedDoor, type OpenDoor } from '../src/hub/doors.js';
import { describeFinding, findSpoilers, secretsAt } from '../src/hub/spoilers.js';
import { doorTools, type Tool } from '../src/hub/tools.js';
import { at, everythingIn, TOOLS } from './helpers.js';

const locked = (doors: Door[]) => doors.filter((door): door is LockedDoor => door.state === 'locked');
const open = (doors: Door[]) => doors.filter((door): door is OpenDoor => door.state === 'open');

describe('the schedule', () => {
  it('is sound: fifteen doors, one a day from 10 to 24 December, at midnight in Brussels', () => {
    expect(checkSchedule(TOOLS, 15)).toEqual([]);
    const behind = doorTools(TOOLS);
    expect(behind.map((tool) => tool.door)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(behind[0]?.launch).toBe('2026-12-10T00:00:00+01:00');
    expect(behind[14]?.launch).toBe('2026-12-24T00:00:00+01:00');
  });

  it('has the doors in the order of the brief', () => {
    expect(doorTools(TOOLS).map((tool) => tool.name)).toEqual(['Arms', 'Seats', 'Names', 'Cities', 'Stats', 'Dynasty', 'Calendar', 'Time', 'Bank', 'Passport', 'Rank', 'Anthem', 'Prompts', 'Wiki', 'Card']);
  });

  const change = (door: number, patch: Partial<Tool>) => TOOLS.map((tool) => (tool.door === door ? { ...tool, ...patch } : tool));

  it('notices a missing, repeated or extra door', () => {
    expect(checkSchedule(TOOLS.filter((tool) => tool.door !== 7), 15).join(' ')).toMatch(/14 doors, not 15/);
    expect(checkSchedule(change(7, { door: 6 })).join(' ')).toMatch(/out of sequence/);
    expect(checkSchedule(TOOLS.filter((tool) => tool.door === undefined))).toEqual(['The calendar has no doors.']);
  });

  it('notices a door that opens at the wrong hour or on the wrong day', () => {
    expect(checkSchedule(change(5, { launch: '2026-12-14T00:00:00Z' })).join(' ')).toMatch(/Door 5 doesn't open at 00:00 in Brussels/);
    expect(checkSchedule(change(5, { launch: '2026-12-13T00:00:00+01:00' })).join(' ')).toMatch(/Door 5 doesn't open the day after door 4/);
    expect(checkSchedule(change(15, { launch: '2026-12-25T00:00:00+01:00' })).join(' ')).toMatch(/Door 15 doesn't open the day after door 14/);
  });

  it('notices a broken entry, and says so without naming it', () => {
    const problems = [
      ...checkSchedule(change(6, { url: 'http://dynasty.eurth.org' })),
      ...checkSchedule(change(6, { url: 'https://dynasty.example.org' })),
      ...checkSchedule(change(6, { launch: '15 December' })),
      ...checkSchedule(change(6, { pitch: 'Who gets the crown.' })),
      ...checkSchedule(change(6, { id: 'arms' })),
      ...checkSchedule(change(6, { kind: 'gadget' as Tool['kind'] })),
      ...checkSchedule(change(6, { kind: 'site' })),
    ];
    expect(problems.length).toBeGreaterThanOrEqual(7);
    for (const problem of problems) expect(problem).not.toMatch(/dynasty|crown/i);
  });
});

describe('the calendar before the first door', () => {
  const calendar = calendarAt(TOOLS, at(9));

  it('has fifteen locked doors and no door for today', () => {
    expect(calendar.season).toBe('before');
    expect(calendar.total).toBe(15);
    expect(calendar.open).toBe(0);
    expect(calendar.today).toBeUndefined();
    expect(locked(calendar.doors)).toHaveLength(15);
  });

  it('gives a locked door its number and date and nothing else', () => {
    expect(calendar.doors[4]).toEqual({ state: 'locked', door: 5, date: '14 Dec', day: '2026-12-14', label: 'Opens 14 Dec', aria: 'Door 5, opens 14 Dec' });
    for (const door of calendar.doors) expect(Object.keys(door).sort()).toEqual(['aria', 'date', 'day', 'door', 'label', 'state']);
  });

  it('knows its year and its first and last days', () => {
    expect(calendar.year).toBe(2026);
    expect(calendar.first).toBe('10 December');
    expect(calendar.last).toBe('24 December');
  });

  it('is the same a second before the first door', () => {
    expect(calendarAt(TOOLS, at(9, 23, 59, 59)).open).toBe(0);
  });
});

describe('the calendar during advent', () => {
  it('opens door 1 at the stroke of midnight on the 10th', () => {
    const calendar = calendarAt(TOOLS, at(10));
    expect(calendar.season).toBe('during');
    expect(calendar.open).toBe(1);
    expect(calendar.today).toBe(1);
    expect(calendar.doors[0]).toEqual({
      state: 'open',
      door: 1,
      date: '10 Dec',
      day: '2026-12-10',
      today: true,
      label: 'Open today',
      name: 'Arms',
      pitch: 'Coats of arms that follow the rules',
      url: 'https://arms.eurth.org',
      host: 'arms.eurth.org',
      aria: 'Door 1, open today: Arms. Coats of arms that follow the rules',
    });
  });

  it('on the 13th has four doors open, the fourth marked as today, as in the mock-up', () => {
    const calendar = calendarAt(TOOLS, at(13, 9, 30));
    expect(open(calendar.doors).map((door) => [door.door, door.label, door.name])).toEqual([
      [1, 'Open', 'Arms'],
      [2, 'Open', 'Seats'],
      [3, 'Open', 'Names'],
      [4, 'Open today', 'Cities'],
    ]);
    expect(locked(calendar.doors).map((door) => door.label)).toEqual([
      'Opens 14 Dec', 'Opens 15 Dec', 'Opens 16 Dec', 'Opens 17 Dec', 'Opens 18 Dec', 'Opens 19 Dec',
      'Opens 20 Dec', 'Opens 21 Dec', 'Opens 22 Dec', 'Opens 23 Dec', 'Opens 24 Dec',
    ]);
    expect(calendar.today).toBe(4);
  });

  it('keeps today\'s door marked until the last second of its day', () => {
    expect(calendarAt(TOOLS, at(13, 23, 59, 59)).today).toBe(4);
    expect(calendarAt(TOOLS, at(14)).today).toBe(5);
  });

  it('goes by Brussels time, not the build server\'s UTC', () => {
    // 23:00 UTC on the 13th is midnight on the 14th in Brussels.
    expect(calendarAt(TOOLS, new Date('2026-12-13T22:59:59Z')).open).toBe(4);
    expect(calendarAt(TOOLS, new Date('2026-12-13T23:00:00Z')).open).toBe(5);
  });

  it('on the 24th has every door open and the last one marked', () => {
    const calendar = calendarAt(TOOLS, at(24, 12));
    expect(calendar.season).toBe('during');
    expect(calendar.open).toBe(15);
    expect(calendar.today).toBe(15);
  });

  it.each(Array.from({ length: 17 }, (_, i) => i + 9))('on %i December holds nothing about a locked tool', (day) => {
    const moment = at(day);
    const calendar = calendarAt(TOOLS, moment);
    expect(calendar.open).toBe(Math.max(0, Math.min(15, day - 9)));
    const secrets = secretsAt(TOOLS, moment);
    expect(secrets).toHaveLength(15 - calendar.open);
    expect(findSpoilers(everythingIn(calendar), secrets, { kinds: ['address', 'pitch', 'name', 'id'] }).map(describeFinding)).toEqual([]);
  });
});

describe('the calendar after advent', () => {
  it('from the 25th keeps every door open, with none marked as today', () => {
    const calendar = calendarAt(TOOLS, at(25));
    expect(calendar.season).toBe('after');
    expect(calendar.open).toBe(15);
    expect(calendar.today).toBeUndefined();
    expect(open(calendar.doors).every((door) => door.label === 'Open' && !door.today)).toBe(true);
  });

  it('is still there the next summer', () => {
    const calendar = calendarAt(TOOLS, new Date('2027-07-01T12:00:00+02:00'));
    expect(calendar.season).toBe('after');
    expect(calendar.year).toBe(2026);
    expect(calendar.open).toBe(15);
  });
});

describe('a calendar with no doors', () => {
  it('is refused', () => {
    expect(() => calendarAt(TOOLS.filter((tool) => tool.door === undefined), at(10))).toThrow();
  });
});
